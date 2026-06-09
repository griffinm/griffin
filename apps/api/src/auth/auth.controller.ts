import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { AuthGuard } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { SignInResponse, RequestWithUser } from '@griffin/types';
import { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post("sign-in")
  async signInWithPassword(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ user: any; jwt: string }> {
    try {
      const result = await this.authService.signInWithPassword(signInDto.email, signInDto.password);
      
      // Set the JWT as an HTTP-only cookie
      response.cookie('jwt', result.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60 * 1000, // 60 days in milliseconds
      });
      
      return result;
    } catch (error) {
      throw new HttpException("Invalid username or password", HttpStatus.UNAUTHORIZED);
    }
  }

  @Post("sign-up")
  async signUpWithPassword(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ user: any; jwt: string }> {
    try {
      const result = await this.authService.signUpWithPassword(
        signUpDto.email,
        signUpDto.firstName,
        signUpDto.password
      );
      
      // Set the JWT as an HTTP-only cookie
      response.cookie('jwt', result.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60 * 1000, // 60 days in milliseconds
      });
      
      return result;
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        throw new HttpException("User with this email already exists", HttpStatus.CONFLICT);
      }
      throw new HttpException("Failed to create account", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("sign-out")
  async signOut(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
    // Clear the JWT cookie with the same options used when setting it
    response.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Signed out successfully' };
  }

  /**
   * Start the Google OAuth flow. Guarded so we know which user is connecting;
   * triggered by a top-level browser navigation so the jwt cookie is sent.
   */
  @Get('google')
  @UseGuards(AuthGuard)
  async connectGoogle(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ): Promise<void> {
    const url = this.googleService.getConsentUrl(request.user.id);
    response.redirect(url);
  }

  /**
   * OAuth redirect target. Called by Google (not the SPA), so it is NOT guarded;
   * the user is identified via the signed `state`. Bounces back to the settings
   * page with a status flag.
   */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    try {
      await this.googleService.handleCallback(code, state);
      response.redirect(`${frontendUrl}/settings?gmail=connected`);
    } catch (error) {
      response.redirect(`${frontendUrl}/settings?gmail=error`);
    }
  }

  @Get('google/status')
  @UseGuards(AuthGuard)
  async googleStatus(
    @Req() request: RequestWithUser,
  ): Promise<{ connected: boolean; email?: string }> {
    return this.googleService.getStatus(request.user.id);
  }

  @Delete('google')
  @UseGuards(AuthGuard)
  async disconnectGoogle(
    @Req() request: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.googleService.disconnect(request.user.id);
    return { message: 'Gmail disconnected' };
  }
}
