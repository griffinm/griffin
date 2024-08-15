import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { AuthService } from "../auth/auth.service";

@Module({
  controllers: [UsersController],
  providers: [
    UserService,
    PrismaService,
    AuthService,
  ],
})
export class UsersModule {}
