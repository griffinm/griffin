import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DataTable, Prisma } from '@prisma/client';
import { NewDataTableDto } from './dto/new-data-table.dto';
import { CloneDataTableDto } from './dto/clone-data-table.dto';
import { UpdateDataTableDto } from './dto/update-data-table.dto';
import { DataTableColumn, DataTableRow } from './data-table.types';

const DEFAULT_COLUMN_COUNT = 3;
const DEFAULT_ROW_COUNT = 3;

function defaultColumns(): DataTableColumn[] {
  return Array.from({ length: DEFAULT_COLUMN_COUNT }, (_, index) => ({
    id: randomUUID(),
    name: `Column ${index + 1}`,
    type: 'text' as const,
  }));
}

function emptyRows(columns: DataTableColumn[], count: number): DataTableRow[] {
  return Array.from({ length: count }, () => ({
    id: randomUUID(),
    cells: Object.fromEntries(columns.map((column) => [column.id, null])),
  }));
}

@Injectable()
export class DataTablesService {
  private readonly logger = new Logger(DataTablesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: NewDataTableDto): Promise<DataTable> {
    await this.assertOwnedNote(dto.noteId, userId);
    const columns = dto.columns?.length ? dto.columns : defaultColumns();
    const rows = dto.rows ?? emptyRows(columns, DEFAULT_ROW_COUNT);
    return this.prisma.dataTable.create({
      data: {
        noteId: dto.noteId,
        userId,
        columns: columns as unknown as Prisma.InputJsonValue,
        rows: rows as unknown as Prisma.InputJsonValue,
        filters: [],
      },
    });
  }

  /**
   * Deep-copy an existing table into a new placement (used when a node is
   * copy/pasted). Row ids are regenerated so the copy is fully independent;
   * column ids are kept because cells, sort, and filters reference them and
   * they only need to be unique within a table.
   */
  async clone(userId: string, dto: CloneDataTableDto): Promise<DataTable> {
    const source = await this.getById(dto.sourceId, userId);
    await this.assertOwnedNote(dto.noteId, userId);
    const rows = (source.rows as unknown as DataTableRow[]).map((row) => ({
      ...row,
      id: randomUUID(),
    }));
    return this.prisma.dataTable.create({
      data: {
        noteId: dto.noteId,
        userId,
        columns: source.columns as Prisma.InputJsonValue,
        rows: rows as unknown as Prisma.InputJsonValue,
        sort:
          source.sort === null
            ? Prisma.DbNull
            : (source.sort as Prisma.InputJsonValue),
        filters: source.filters as Prisma.InputJsonValue,
      },
    });
  }

  async getById(id: string, userId: string): Promise<DataTable> {
    const table = await this.prisma.dataTable.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!table) {
      throw new NotFoundException('Data table not found');
    }
    return table;
  }

  async update(id: string, userId: string, dto: UpdateDataTableDto): Promise<DataTable> {
    await this.getById(id, userId);
    const data: Prisma.DataTableUpdateInput = {};
    if (dto.columns !== undefined) {
      data.columns = dto.columns as unknown as Prisma.InputJsonValue;
    }
    if (dto.rows !== undefined) {
      data.rows = dto.rows as unknown as Prisma.InputJsonValue;
    }
    if (dto.sort !== undefined) {
      data.sort =
        dto.sort === null
          ? Prisma.DbNull
          : (dto.sort as unknown as Prisma.InputJsonValue);
    }
    if (dto.filters !== undefined) {
      data.filters = dto.filters as unknown as Prisma.InputJsonValue;
    }
    return this.prisma.dataTable.update({ where: { id }, data });
  }

  async deleteById(id: string, userId: string): Promise<DataTable> {
    await this.getById(id, userId);
    return this.prisma.dataTable.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwnedNote(noteId: string, userId: string): Promise<void> {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, deletedAt: null, notebook: { userId } },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
  }
}
