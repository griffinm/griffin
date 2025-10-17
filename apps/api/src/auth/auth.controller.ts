import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SignInResponse } from '@griffin/types';
import { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in")
  async signInWithPassword(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<SignInResponse> {
    try {
      const jwt = await this.authService.signInWithPassword(signInDto.email, signInDto.password);
      
      // Set the JWT as an HTTP-only cookie
      response.cookie('jwt', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60 * 1000, // 60 days in milliseconds
      });
      
      return { jwt };
    } catch (error) {
      throw new HttpException("Invalid username or password", HttpStatus.UNAUTHORIZED);
    }
  }

  @Post("sign-out")
  async signOut(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
    // Clear the JWT cookie
    response.clearCookie('jwt');
    return { message: 'Signed out successfully' };
  }
}
