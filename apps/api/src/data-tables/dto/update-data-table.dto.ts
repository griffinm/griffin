import { IsArray, IsObject, IsOptional, ValidateIf } from 'class-validator';
import type {
  DataTableColumn,
  DataTableFilter,
  DataTableRow,
  DataTableSort,
} from '../data-table.types';

export class UpdateDataTableDto {
  @IsArray()
  @IsOptional()
  columns?: DataTableColumn[];

  @IsArray()
  @IsOptional()
  rows?: DataTableRow[];

  /** null clears the sort; undefined leaves it unchanged. */
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  @IsOptional()
  sort?: DataTableSort | null;

  @IsArray()
  @IsOptional()
  filters?: DataTableFilter[];
}
