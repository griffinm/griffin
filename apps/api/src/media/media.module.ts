import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import { UserService } from '../users/user.service';  
import { PrismaService } from '../prisma.service';
import { MediaService } from './media.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService, 
    S3Service, 
    UserService, 
    PrismaService,
  ],
  imports: [ConfigModule],
})
export class MediaModule {}
