import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import type { DataTable as PrismaDataTable } from '@prisma/client';
import type {
  DataTableColumn,
  DataTableFilter,
  DataTableRow,
  DataTableSort,
} from '../data-table.types';

@Exclude()
export class DataTableEntity {
  @Expose()
  id: string;

  @Expose()
  noteId: string;

  @Expose()
  userId: string;

  @Expose()
  columns: DataTableColumn[];

  @Expose()
  rows: DataTableRow[];

  @Expose()
  sort: DataTableSort | null;

  @Expose()
  filters: DataTableFilter[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt?: Date;

  constructor(partial: Partial<DataTableEntity> | PrismaDataTable) {
    Object.assign(this, instanceToPlain(partial));
  }
}
