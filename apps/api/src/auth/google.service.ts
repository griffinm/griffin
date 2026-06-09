import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth as googleAuth, gmail } from '@googleapis/gmail';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/crypto.util';

/** Read-only Gmail scope — lets the agent search and read mail, nothing else. */
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/** Thrown by getGmailClient when the user has not connected their Gmail yet. */
export class GmailNotConnectedError extends Error {
  constructor() {
    super('Gmail is not connected for this user');
    this.name = 'GmailNotConnectedError';
  }
}

type OAuthState = { userId: string; nonce: string };

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private createOAuthClient() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth env vars are not configured');
    }
    return new googleAuth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Build the Google consent URL. The `state` is a short-lived JWT carrying the
   * userId so the (unauthenticated) callback can attribute the tokens to the
   * right user and reject forged callbacks (CSRF).
   */
  getConsentUrl(userId: string): string {
    const client = this.createOAuthClient();
    const state = jwt.sign(
      { userId, nonce: crypto.randomBytes(16).toString('hex') } as OAuthState,
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: '10m' },
    );
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // force a refresh_token every time
      scope: [GMAIL_SCOPE],
      state,
    });
  }

  /**
   * Exchange the OAuth `code` for tokens, look up the connected address, and
   * persist the (encrypted) refresh token. Returns the connected email.
   */
  async handleCallback(code: string, state: string): Promise<{ email: string }> {
    let userId: string;
    try {
      userId = (jwt.verify(state, process.env.JWT_TOKEN_SECRET) as OAuthState).userId;
    } catch {
      throw new Error('Invalid or expired OAuth state');
    }

    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const gmailClient = gmail({ version: 'v1', auth: client });
    const profile = await gmailClient.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress ?? 'unknown';

    const existing = await this.prisma.googleConnection.findUnique({
      where: { userId },
    });
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : existing?.refreshToken;
    if (!encryptedRefresh) {
      throw new Error(
        'Google did not return a refresh token; please disconnect and reconnect.',
      );
    }

    await this.prisma.googleConnection.upsert({
      where: { userId },
      create: {
        userId,
        email,
        refreshToken: encryptedRefresh,
        scope: tokens.scope ?? GMAIL_SCOPE,
      },
      update: {
        email,
        refreshToken: encryptedRefresh,
        scope: tokens.scope ?? GMAIL_SCOPE,
      },
    });

    return { email };
  }

  /**
   * Return an authenticated Gmail API client for the user. The OAuth client
   * refreshes the (short-lived) access token from the stored refresh token on
   * demand; if Google rotates the refresh token we re-persist it.
   * @throws GmailNotConnectedError if the user has no connection.
   */
  async getGmailClient(userId: string) {
    const conn = await this.prisma.googleConnection.findUnique({
      where: { userId },
    });
    if (!conn) {
      throw new GmailNotConnectedError();
    }

    const client = this.createOAuthClient();
    client.setCredentials({ refresh_token: decrypt(conn.refreshToken) });
    client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        this.prisma.googleConnection
          .update({
            where: { userId },
            data: { refreshToken: encrypt(tokens.refresh_token) },
          })
          .catch((err) =>
            this.logger.error(`Failed to persist rotated refresh token: ${err.message}`),
          );
      }
    });

    return gmail({ version: 'v1', auth: client });
  }

  async getStatus(userId: string): Promise<{ connected: boolean; email?: string }> {
    const conn = await this.prisma.googleConnection.findUnique({
      where: { userId },
    });
    return conn ? { connected: true, email: conn.email } : { connected: false };
  }

  async disconnect(userId: string): Promise<void> {
    const conn = await this.prisma.googleConnection.findUnique({
      where: { userId },
    });
    if (!conn) return;

    // Best-effort token revocation at Google; ignore failures.
    try {
      const client = this.createOAuthClient();
      await client.revokeToken(decrypt(conn.refreshToken));
    } catch (err) {
      this.logger.warn(`Failed to revoke Google token: ${err.message}`);
    }

    await this.prisma.googleConnection.delete({ where: { userId } });
  }
}
