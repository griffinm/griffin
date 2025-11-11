import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { SignInResponse } from '@griffin/types';
import { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
