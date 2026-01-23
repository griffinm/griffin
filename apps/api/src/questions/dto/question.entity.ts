import { Exclude, Expose } from "class-transformer";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

@Exclude()
export class QuestionEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  question: string;

  @IsString()
  @IsOptional()
  @Expose()
  answer?: string;

  @IsDateString()
  @Expose()
  createdAt?: Date;

  @IsDateString()
  @Expose()
  updatedAt?: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  noteId: string;

  @IsString()
  @IsOptional()
  @Expose()
  noteTitle?: string;

  @IsString()
  @IsOptional()
  @Expose()
  notebookName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  userId: string;

  @IsDateString()
  @IsOptional()
  @Expose()
  deletedAt?: Date;
}
