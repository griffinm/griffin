import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createOpenAIClient, OpenAIClient } from "@griffin/open-ai";
import { PrismaService } from "../prisma/prisma.service";
import { UploadAudioDto } from "./dto";
import { AudioTranscription } from "@prisma/client";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly openAIClient: OpenAIClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }

    this.openAIClient = createOpenAIClient({
      apiKey: apiKey || '',
    });
  }

  async transcribeAudio(
    userId: string,
    file: Express.Multer.File,
    options: UploadAudioDto
  ): Promise<AudioTranscription> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting transcription for file: ${file.originalname} (user: ${userId})`);
      
      // Use the open-ai library's transcribeFromBuffer method
      const result = await this.openAIClient.transcribeFromBuffer(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          language: options.language,
          prompt: options.prompt,
          response_format: options.responseFormat,
        }
      );

      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `Transcription completed in ${processingTime}ms for file: ${file.originalname}`
      );

      // Save transcription to database
      const transcriptionRecord = await this.prisma.audioTranscription.create({
        data: {
          userId,
          transcription: result.text,
          language: result.language,
          duration: options.duration,
          processingTime,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          model: 'whisper-1',
          responseFormat: options.responseFormat || 'json',
          prompt: options.prompt,
        },
      });

      this.logger.log(
        `Transcription saved to database with ID: ${transcriptionRecord.id}`
      );

      return transcriptionRecord;
    } catch (error) {
      this.logger.error(
        `Transcription failed for file: ${file.originalname}`,
        error.stack
      );
      throw error;
    }
  }

  async getTranscriptionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AudioTranscription[]> {
    return this.prisma.audioTranscription.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getTranscriptionById(
    userId: string,
    transcriptionId: string
  ): Promise<AudioTranscription | null> {
    return this.prisma.audioTranscription.findFirst({
      where: {
        id: transcriptionId,
        userId,
        deletedAt: null,
      },
    });
  }

  async deleteTranscription(
    userId: string,
    transcriptionId: string
  ): Promise<void> {
    await this.prisma.audioTranscription.updateMany({
      where: {
        id: transcriptionId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}