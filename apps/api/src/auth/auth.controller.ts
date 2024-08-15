import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SignInResponse } from '@griffin/types';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in")
  async signInWithPassword(
    @Body() signInDto: SignInDto
  ): Promise<SignInResponse> {
    try {
      const jwt = await this.authService.signInWithPassword(signInDto.email, signInDto.password);
      return { jwt };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}