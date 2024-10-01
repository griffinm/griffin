import { TaskPriority } from '@prisma/client';
import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  ValidateIf,
  IsEnum,
} from 'class-validator';

@Exclude()
export class TaskEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @IsDateString()
  @IsOptional()
  @Expose()
  dueDate?: Date;

  @ValidateIf(o => o.completedAt)
  @IsDateString()
  @IsOptional()
  @Expose()
  completedAt?: Date | null;

  @IsDateString()
  @Expose()
  createdAt: Date;

  @IsDateString()
  @Expose()
  updatedAt: Date;

  @IsDateString()
  @IsOptional()
  @Exclude()
  deletedAt?: Date;

  @IsString()
  @IsOptional()
  @Expose()
  noteId?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  @Expose()
  priority: TaskPriority;

  constructor(partial: Partial<TaskEntity>) {
    Object.assign(this, instanceToPlain(partial));
  }
}
