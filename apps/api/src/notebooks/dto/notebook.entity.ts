import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class NotebookEntity {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}
