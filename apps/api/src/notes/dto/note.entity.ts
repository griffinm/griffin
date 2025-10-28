import {
  IsDateString,
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
  notebookId?: string;

  @IsDateString()
  @IsOptional()
  @Expose()
  createdAt?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  updatedAt?: Date;

  @IsArray()
  @IsOptional()
  @Expose()
  @Type(() => TagEntity)
  tags?: TagEntity[];
}
