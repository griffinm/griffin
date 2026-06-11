import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { DataTableColumn, DataTableRow } from '../data-table.types';

export class NewDataTableDto {
  @IsString()
  @IsNotEmpty()
  noteId: string;

  @IsArray()
  @IsOptional()
  columns?: DataTableColumn[];

  @IsArray()
  @IsOptional()
  rows?: DataTableRow[];
}
