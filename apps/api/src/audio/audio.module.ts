import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AudioController } from "./audio.controller";
import { AudioService } from "./audio.service";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [AudioController],
  providers: [AudioService],
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => AuthModule),
  ],
})
export class AudioModule {}