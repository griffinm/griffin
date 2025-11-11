import { 
  Controller, 
  Post,
  Get,
  Delete,
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AudioService } from "./audio.service";
import { AuthGuard } from "../auth/auth.guard";
import { UploadAudioDto, AudioResponseDto } from "./dto";
import type { RequestWithUser } from "@griffin/types";
import { AudioTranscription } from "@prisma/client";

@Controller()
@UseGuards(AuthGuard)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @Req() request: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB
          new FileTypeValidator({ fileType: /(audio\/(mpeg|wav|webm|ogg|mp3|m4a))/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() uploadAudioDto: UploadAudioDto,
  ): Promise<AudioResponseDto> {
    const startTime = Date.now();
    
    try {
      const transcriptionRecord = await this.audioService.transcribeAudio(
        request.user.id,
        file,
        uploadAudioDto
      );
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        id: transcriptionRecord.id,
        transcription: transcriptionRecord.transcription,
        language: transcriptionRecord.language,
        duration: transcriptionRecord.duration,
        processingTime,
        fileName: transcriptionRecord.fileName,
        fileSize: transcriptionRecord.fileSize,
        createdAt: transcriptionRecord.createdAt,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        message: error.message || 'Transcription failed',
        transcription: '',
        processingTime,
      };
    }
  }

  @Get('audio/history')
  async getTranscriptionHistory(
    @Req() request: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AudioTranscription[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.audioService.getTranscriptionHistory(
      request.user.id,
      parsedLimit,
      parsedOffset
    );
  }

  @Get('audio/:id')
  async getTranscriptionById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<AudioTranscription> {
    const transcription = await this.audioService.getTranscriptionById(
      request.user.id,
      id
    );

    if (!transcription) {
      throw new HttpException('Transcription not found', HttpStatus.NOT_FOUND);
    }

    return transcription;
  }

  @Delete('audio/:id')
  async deleteTranscription(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.audioService.deleteTranscription(request.user.id, id);
    return {
      success: true,
      message: 'Transcription deleted successfully',
    };
  }
}