import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UploadAudioDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  format?: string;
}

