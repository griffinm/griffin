import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

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
}
