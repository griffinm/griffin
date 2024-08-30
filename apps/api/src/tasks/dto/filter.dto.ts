import { IsDateString, IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export enum SortBy {
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
}

export class FilterDto {
  @IsOptional()
  @IsDateString()
  completedAt?: Date | string | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
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
}

