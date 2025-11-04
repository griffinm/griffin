export class AudioResponseDto {
  success: boolean;
  message?: string;
  id?: string;
  transcription: string;
  language?: string;
  duration?: number;
  processingTime?: number;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
}

