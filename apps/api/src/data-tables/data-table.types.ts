/**
 * Shapes stored in the DataTable Json columns. Kept in sync with the
 * frontend types in apps/ui2/src/types/dataTable.ts.
 */
export type DataTableColumnType = 'text' | 'number' | 'date' | 'select';

export interface DataTableColumn {
  /** Stable uuid; referenced by row cells, sort, and filters. */
  id: string;
  name: string;
  type: DataTableColumnType;
  /** Allowed values when type === 'select' with custom (typed-in) options. */
  options?: string[];
  /**
   * When type === 'select': source the options from this reusable Dropdown
   * definition instead of `options`; cells then store the option id.
   */
  dropdownId?: string;
  /** Reserved for future column resizing. */
  width?: number;
}

export type DataTableCellValue = string | number | null;

export interface DataTableRow {
  /** Stable uuid. */
  id: string;
  /** columnId -> value */
  cells: Record<string, DataTableCellValue>;
}

export interface DataTableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface DataTableFilter {
  columnId: string;
  op:
    | 'contains'
    | 'equals'
    | 'notEquals'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'isEmpty'
    | 'isNotEmpty';
  value: DataTableCellValue;
}
