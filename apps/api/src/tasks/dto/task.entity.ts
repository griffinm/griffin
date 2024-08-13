import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
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
  description: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @IsDateString()
  @IsOptional()
  completedAt?: Date;

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