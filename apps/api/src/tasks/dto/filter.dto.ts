import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";
import { TaskPriority } from "@prisma/client";
import { CompletedFilterOptions } from "@griffin/types";

export enum SortBy {
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
}

export class FilterDto {
  @IsOptional()
  @IsString()
  completed?: CompletedFilterOptions;

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
}

