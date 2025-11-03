import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AudioService } from "./audio.service";
import { AuthGuard } from "../auth/auth.guard";
import { UploadAudioDto, AudioResponseDto } from "./dto";

@Controller()
@UseGuards(AuthGuard)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
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
    // File and metadata are now available
    // file.buffer contains the audio data
    // file.originalname, file.mimetype, file.size are available
    // uploadAudioDto contains any additional metadata sent from frontend
    
    return {
      success: true,
    };
  }
}