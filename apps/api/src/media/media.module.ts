import { Module, forwardRef } from '@nestjs/common';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import { MediaService } from './media.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [MediaController],
  providers: [
    MediaService, 
    S3Service, 
  ],
  exports: [MediaService],
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
})
export class MediaModule {}
