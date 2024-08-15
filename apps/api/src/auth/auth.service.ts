import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService
  ) {}


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

    const token = jwt.sign({ 
      userId: user.id,
      email: user.email,
    }, process.env.JWT_TOKEN_SECRET);

    return token;
  }
}