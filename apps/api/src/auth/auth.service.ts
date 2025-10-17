import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { JwtPayload } from '@griffin/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async validateJwt(token: string): Promise<User> {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET) as JwtPayload;
    return this.prisma.user.findUnique({ where: { id: decoded.userId } });
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ user: User; jwt: string }> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const payload: JwtPayload & { exp: number } = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60), // 60 days
    };

    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

    return { user, jwt: token };
  }

  async signUpWithPassword(
    email: string,
    firstName: string,
    password: string,
  ): Promise<{ user: User; jwt: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const payload: JwtPayload & { exp: number } = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60), // 60 days
    };

    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

    return { user, jwt: token };
  }
}
