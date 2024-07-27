import { Module } from "@nestjs/common";
import { UserService } from "../users/user.service";
import { PrismaService } from "../prisma.service";

@Module({
  providers: [UserService, PrismaService],
})
export class AuthModule {}
