import { Injectable } from "@nestjs/common";
import { UploadedFileProps } from "./s3.service";
import { Media } from "@prisma/client";
import { PrismaService } from "../prisma.service";

type CreateMediaForNoteProps = {
  userId: string;
  noteId: string;
  file: UploadedFileProps;
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createMediaForNote({
    userId,
    noteId,
    file,
  }: CreateMediaForNoteProps): Promise<Media> {
    return this.prisma.media.create({
      data: {
        noteId,
        key: file.Key,
        userId,
        mimeType: file.mimeType,
        size: file.size,
        publicUrl: `https://griffin-media.s3.amazonaws.com/${file.Key}`
      },
    });
  }
}
