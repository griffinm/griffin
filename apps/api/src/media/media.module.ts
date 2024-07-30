import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import { UserService } from '../users/user.service';  
import { PrismaService } from '../prisma.service';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService, 
    S3Service, 
    UserService, 
    PrismaService
  ],
})
export class MediaModule {}
