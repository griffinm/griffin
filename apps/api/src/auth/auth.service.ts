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
  ): Promise<string> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, { expiresIn: '60d' });

    return token;
  }
}
