export type ColumnType = 'text' | 'number' | 'date' | 'select';

export interface DataTableColumn {
  /** Stable uuid; referenced by row cells, sort, and filters. */
  id: string;
  name: string;
  type: ColumnType;
  /** Allowed values when type === 'select' with custom (typed-in) options. */
  options?: string[];
  /**
   * When type === 'select': source the options from this reusable Dropdown
   * definition instead of `options`. Cells then store the *option id* (like
   * DropdownInstance.selectedOptionId), so renaming an option in the Dropdown
   * config propagates to every cell that uses it.
   */
  dropdownId?: string;
  /** Reserved for future column resizing. */
  width?: number;
}

/**
 * Stored value by column type:
 * text -> string, number -> number, date -> ISO string, select -> string.
 */
export type CellValue = string | number | null;

export interface DataTableRow {
  /** Stable uuid. */
  id: string;
  /** columnId -> value */
  cells: Record<string, CellValue>;
}

export interface DataTableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export type FilterOp =
  | 'contains'
  | 'equals'
  | 'notEquals'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'isEmpty'
  | 'isNotEmpty';

export interface DataTableFilter {
  columnId: string;
  op: FilterOp;
  value: CellValue;
}

export interface DataTable {
  id: string;
  noteId: string;
  userId: string;
  columns: DataTableColumn[];
  /** Stored in insertion order; sort/filter apply to the rendered view only. */
  rows: DataTableRow[];
  sort: DataTableSort | null;
  filters: DataTableFilter[];
  createdAt: Date;
  updatedAt: Date;
}
