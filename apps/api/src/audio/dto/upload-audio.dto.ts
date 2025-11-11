import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';

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

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsIn(['json', 'text', 'srt', 'verbose_json', 'vtt'])
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

