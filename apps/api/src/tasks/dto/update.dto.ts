import { TaskPriority, TaskStatus } from '@prisma/client';
import { 
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

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
  @IsOptional()
  deletedAt?: Date;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
