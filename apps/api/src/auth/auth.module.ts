import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
@Module({
  providers: [
    AuthService,
    PrismaService,
    AuthGuard,
  ],
  controllers: [
    AuthController,
  ],
  exports: [],
})
export class AuthModule {}
