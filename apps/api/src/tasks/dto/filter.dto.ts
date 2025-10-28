import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";
import { TaskPriority, TaskStatus } from "@prisma/client";

export enum SortBy {
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
  COMPLETED_AT = 'completedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FilterDto {
  @IsOptional()
  @IsString()
  status?: TaskStatus | string; // Can be a single status or comma-separated list

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  resultsPerPage?: number;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  tags?: string; // Comma-separated tag IDs
}

