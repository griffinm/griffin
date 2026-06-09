import * as crypto from 'crypto';

/**
 * Symmetric encryption helpers for secrets stored at rest (e.g. OAuth refresh
 * tokens). Uses AES-256-GCM with a per-call random IV. The key comes from the
 * APP_ENCRYPTION_KEY env var, which must be 32 bytes encoded as 64 hex chars
 * (generate with `openssl rand -hex 32`).
 *
 * Encrypted payload format (all hex, colon-separated): `iv:authTag:ciphertext`.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard nonce length

function getKey(): Buffer {
  const hexKey = process.env.APP_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('APP_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      'APP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)',
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(payload: string): string {
  const [ivHex, authTagHex, ciphertextHex] = payload.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted payload format');
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
