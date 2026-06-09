import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { TagEntity } from '../../tag/entities/tag.entity';

@Exclude()
export class NoteEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsOptional()
  @Expose()
  title?: string;

  @IsString()
  @IsOptional()
  @Expose()
  content?: string;

  @IsString()
  @IsOptional()
  @Expose()
  preview?: string;

  @IsString()
  @IsOptional()
  @Expose()
  notebookId?: string;

  @IsInt()
  @IsOptional()
  @Expose()
  version?: number;

  @IsDateString()
  @IsOptional()
  @Expose()
  createdAt?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  updatedAt?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  pinnedAt?: Date | null;

  @IsArray()
  @IsOptional()
  @Expose()
  @Type(() => TagEntity)
  tags?: TagEntity[];
}
