import { forwardRef, Module } from "@nestjs/common";
import { AudioController } from "./audio.controller";
import { AudioService } from "./audio.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [AudioController],
  providers: [AudioService],
  imports: [forwardRef(() => AuthModule)],
})
export class AudioModule {}