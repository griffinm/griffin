import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from "./s3.service";
import { MediaService } from "./media.service";
import { AuthGuard } from "../auth/auth.guard";
import { Media } from "@prisma/client";

@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Req() request: any,
    @Body() body,
  ): Promise<Media> {
    // First upload the file to S3
    const uploadedFile = await this.s3Service.uploadFile(file);
    const noteId = JSON.parse(body.metadata).metadata.noteId
    // Then create a media record in the database
    return this.mediaService.createMediaForNote({
      userId: request.user.id,
      noteId,
      file: uploadedFile,
    });
  }
}
