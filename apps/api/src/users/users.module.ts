import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { AuthService } from "../auth/auth.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [UsersController],
  providers: [
    UserService,
    AuthService,
  ],
  exports: [UserService],
  imports: [PrismaModule],
})
export class UsersModule {}
