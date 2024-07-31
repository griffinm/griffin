import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class MediaEntity {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  noteId?: string;

  @IsDateString()
  createdAt: Date;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsNotEmpty()
  publicUrl: string;
}
