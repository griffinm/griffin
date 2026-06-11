import {
  CellValue,
  ColumnType,
  DataTableColumn,
  DataTableFilter,
  DataTableRow,
  DataTableSort,
  FilterOp,
} from '@/types/dataTable'

export interface ResolvedSelectOption {
  /** The value stored in cells: a Dropdown option id, or the literal string. */
  value: string
  label: string
  /** Mantine color token (dropdown-backed options only). */
  color?: string
}

/**
 * A column enriched for rendering: select columns get their options resolved —
 * from the linked Dropdown definition (value = option id) or from the column's
 * own `options` (value = the string itself). Computed in the NodeView, never
 * persisted.
 */
export interface ResolvedColumn extends DataTableColumn {
  resolvedOptions?: ResolvedSelectOption[]
}

export const isEmptyValue = (value: CellValue | undefined): boolean =>
  value === null || value === undefined || value === ''

/** The stored cell values of a select column in their defined order. */
const selectOrder = (column: ResolvedColumn): string[] =>
  column.resolvedOptions?.map((option) => option.value) ?? column.options ?? []

/** The label a select cell displays (= the raw value for custom options). */
export const resolveSelectLabel = (
  value: CellValue | undefined,
  column: ResolvedColumn,
): string => {
  if (isEmptyValue(value)) return ''
  const option = column.resolvedOptions?.find((o) => o.value === String(value))
  return option ? option.label : String(value)
}

/**
 * Map a cell value onto a comparable primitive for its column. Returns null
 * when the value is empty or unparseable so callers can sort it last. Select
 * values compare by their position in the defined option order (Todo before
 * Done because you said so, not alphabetically); unknown values cluster after
 * the defined options.
 */
const toComparable = (
  value: CellValue | undefined,
  column: ResolvedColumn,
): number | string | null => {
  if (isEmptyValue(value)) return null
  switch (column.type) {
    case 'number': {
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }
    case 'date': {
      const t = Date.parse(String(value))
      return Number.isNaN(t) ? null : t
    }
    case 'select': {
      const order = selectOrder(column)
      if (order.length > 0) {
        const index = order.indexOf(String(value))
        return index === -1 ? order.length : index
      }
      return resolveSelectLabel(value, column).toLowerCase()
    }
    default:
      return String(value).toLowerCase()
  }
}

const compareValues = (
  a: CellValue | undefined,
  b: CellValue | undefined,
  column: ResolvedColumn,
): number => {
  const ca = toComparable(a, column)
  const cb = toComparable(b, column)
  // Empty values sort last regardless of direction's sign flip, so the caller
  // applies direction only to the non-null comparison.
  if (ca === null && cb === null) return 0
  if (ca === null) return 1
  if (cb === null) return -1
  if (typeof ca === 'number' && typeof cb === 'number') return ca - cb
  return String(ca).localeCompare(String(cb))
}

const matchesFilter = (
  value: CellValue | undefined,
  filter: DataTableFilter,
  column: ResolvedColumn,
): boolean => {
  switch (filter.op) {
    case 'isEmpty':
      return isEmptyValue(value)
    case 'isNotEmpty':
      return !isEmptyValue(value)
    default:
      break
  }

  // Remaining ops compare against the filter value; an unset filter value
  // matches everything so a half-built filter doesn't blank the table.
  if (isEmptyValue(filter.value)) return true
  if (isEmptyValue(value)) return false

  if (filter.op === 'contains') {
    return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
  }

  // Select equality is raw-value identity (two distinct orphaned values must
  // not collide just because both fall outside the defined option order).
  if (column.type === 'select') {
    const equal = String(value) === String(filter.value)
    if (filter.op === 'equals') return equal
    if (filter.op === 'notEquals') return !equal
    return true
  }

  const cell = toComparable(value, column)
  const target = toComparable(filter.value, column)
  if (cell === null || target === null) return false
  const diff =
    typeof cell === 'number' && typeof target === 'number'
      ? cell - target
      : String(cell).localeCompare(String(target))

  switch (filter.op) {
    case 'equals':
      return diff === 0
    case 'notEquals':
      return diff !== 0
    case 'gt':
      return diff > 0
    case 'gte':
      return diff >= 0
    case 'lt':
      return diff < 0
    case 'lte':
      return diff <= 0
    default:
      return true
  }
}

/**
 * Apply the persisted filters and sort to the stored rows for rendering.
 * Non-destructive: returns a new array, stored row order is never changed.
 */
export const applyView = (
  rows: DataTableRow[],
  columns: ResolvedColumn[],
  filters: DataTableFilter[],
  sort: DataTableSort | null,
): DataTableRow[] => {
  const columnById = new Map(columns.map((column) => [column.id, column]))

  let view = rows.filter((row) =>
    filters.every((filter) => {
      const column = columnById.get(filter.columnId)
      if (!column) return true // filter on a deleted column is ignored
      return matchesFilter(row.cells[filter.columnId], filter, column)
    }),
  )

  const sortColumn = sort ? columnById.get(sort.columnId) : undefined
  if (sort && sortColumn) {
    const sign = sort.direction === 'desc' ? -1 : 1
    view = [...view].sort((a, b) => {
      const diff = compareValues(
        a.cells[sort.columnId],
        b.cells[sort.columnId],
        sortColumn,
      )
      // Empty values stay last in both directions: compareValues already put
      // them last, so only flip the sign for real comparisons.
      const aEmpty = isEmptyValue(a.cells[sort.columnId])
      const bEmpty = isEmptyValue(b.cells[sort.columnId])
      if (aEmpty || bEmpty) return diff
      return diff * sign
    })
  }

  return view
}

/** Best-effort coercion of a cell value when its column changes type. */
export const coerceValue = (value: CellValue | undefined, to: ColumnType): CellValue => {
  if (isEmptyValue(value)) return null
  switch (to) {
    case 'number': {
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }
    case 'date': {
      const t = Date.parse(String(value))
      return Number.isNaN(t) ? null : formatDateValue(new Date(t))
    }
    default:
      return String(value)
  }
}

/** Dates are stored as plain `YYYY-MM-DD` strings (sortable via Date.parse). */
export const formatDateValue = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** The filter operators that make sense for each column type. */
export const filterOpsForType = (
  type: ColumnType,
): { value: FilterOp; label: string }[] => {
  switch (type) {
    case 'number':
      return [
        { value: 'equals', label: '=' },
        { value: 'notEquals', label: '≠' },
        { value: 'gt', label: '>' },
        { value: 'gte', label: '≥' },
        { value: 'lt', label: '<' },
        { value: 'lte', label: '≤' },
        { value: 'isEmpty', label: 'is empty' },
        { value: 'isNotEmpty', label: 'is not empty' },
      ]
    case 'date':
      return [
        { value: 'equals', label: 'is' },
        { value: 'gte', label: 'on or after' },
        { value: 'lte', label: 'on or before' },
        { value: 'isEmpty', label: 'is empty' },
        { value: 'isNotEmpty', label: 'is not empty' },
      ]
    case 'select':
      return [
        { value: 'equals', label: 'is' },
        { value: 'notEquals', label: 'is not' },
        { value: 'isEmpty', label: 'is empty' },
        { value: 'isNotEmpty', label: 'is not empty' },
      ]
    default:
      return [
        { value: 'contains', label: 'contains' },
        { value: 'equals', label: 'is' },
        { value: 'notEquals', label: 'is not' },
        { value: 'isEmpty', label: 'is empty' },
        { value: 'isNotEmpty', label: 'is not empty' },
      ]
  }
}
