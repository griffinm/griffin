import { Exclude, Expose } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

@Exclude()
export class NotebookEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsBoolean()
  @IsOptional()
  @Expose()
  isDefault: boolean;

  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsDateString()
  @Expose()
  createdAt: Date;

  @IsDateString()
  @Expose()
  updatedAt: Date;

  @IsString()
  @IsOptional()
  @Expose()
  parentId?: string;

  @IsArray()
  @IsOptional()
  children?: NotebookEntity[];
}
