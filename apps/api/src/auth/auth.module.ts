import { Module } from "@nestjs/common";
import { UserService } from "../users/user.service";
import { PrismaService } from "../prisma.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  providers: [
    UserService,
    PrismaService,
    AuthService,
  ],
  controllers: [
    AuthController,
  ],
  exports: [
    AuthService,
  ],
})
export class AuthModule {}
