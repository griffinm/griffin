import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class NoteEntity {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;
  
  @IsInt()
  @IsNotEmpty()
  notebookId: number;

  @IsDateString()
  createdAt?: Date;

  @IsDateString()
  updatedAt?: Date;
}
