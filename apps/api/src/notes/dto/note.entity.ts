import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class NoteEntity {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;
  
  @IsString()
  @IsNotEmpty()
  notebookId: string;

  @IsDateString()
  createdAt?: Date;

  @IsDateString()
  updatedAt?: Date;
}
