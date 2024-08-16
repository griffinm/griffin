import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class TaskEntity {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ValidateIf(o => o.completedAt)
  @IsDateString()
  @IsOptional()
  completedAt?: Date | null;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsDateString()
  @IsOptional()
  deletedAt?: Date;

  constructor(partial: Partial<TaskEntity>) {
    Object.assign(this, partial);
  }
}