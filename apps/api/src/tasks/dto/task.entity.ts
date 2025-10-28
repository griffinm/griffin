import { TaskPriority, TaskStatus } from '@prisma/client';
import { Exclude, Expose, instanceToPlain, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  ValidateIf,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { TagEntity } from '../../tag/entities/tag.entity';

@Exclude()
export class TaskStatusHistoryEntity {
  @Expose()
  id: string;

  @Expose()
  taskId: string;

  @Expose()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @Expose()
  @IsDateString()
  changedAt: Date;
}

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

  @IsEnum(TaskStatus)
  @IsOptional()
  @Expose()
  status: TaskStatus;

  @IsDateString()
  @IsOptional()
  @Expose()
  statusChangedAt?: Date;

  @IsArray()
  @IsOptional()
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => TaskStatusHistoryEntity)
  statusHistory?: TaskStatusHistoryEntity[];

  @IsArray()
  @IsOptional()
  @Expose()
  @Type(() => TagEntity)
  tags?: TagEntity[];

  constructor(partial: Partial<TaskEntity>) {
    Object.assign(this, instanceToPlain(partial));
  }
}
