import { ActionIcon, Button, Select } from '@mantine/core'
import { IconFilter, IconX } from '@tabler/icons-react'
import { DataTableFilter, FilterOp } from '@/types/dataTable'
import { CellEditor } from './CellEditor'
import { ResolvedColumn, filterOpsForType } from './view'

/**
 * Editor for the table's persisted filters: one row per filter
 * (column -> operator -> value), AND-combined. Columns come in resolved so a
 * dropdown-backed select column offers its Dropdown's options as the value.
 */
export function FilterBar({
  columns,
  filters,
  onChange,
}: {
  columns: ResolvedColumn[]
  filters: DataTableFilter[]
  onChange: (_filters: DataTableFilter[]) => void
}) {
  if (columns.length === 0) return null

  const updateFilter = (index: number, changes: Partial<DataTableFilter>) => {
    onChange(filters.map((f, i) => (i === index ? { ...f, ...changes } : f)))
  }

  const addFilter = () => {
    const column = columns[0]
    onChange([
      ...filters,
      { columnId: column.id, op: filterOpsForType(column.type)[0].value, value: null },
    ])
  }

  return (
    <div className="data-table__filters">
      {filters.map((filter, index) => {
        const column =
          columns.find((c) => c.id === filter.columnId) ?? columns[0]
        const ops = filterOpsForType(column.type)
        const needsValue = filter.op !== 'isEmpty' && filter.op !== 'isNotEmpty'
        return (
          // Filters have no stable id; index keys are fine for this short list.
          // eslint-disable-next-line react/no-array-index-key
          <div className="data-table__filter" key={index}>
            <Select
              size="xs"
              w={120}
              data={columns.map((c) => ({ value: c.id, label: c.name }))}
              value={column.id}
              allowDeselect={false}
              onChange={(columnId) => {
                if (!columnId || columnId === filter.columnId) return
                const next = columns.find((c) => c.id === columnId)
                if (!next) return
                // Reset the operator and value: they are type-specific.
                updateFilter(index, {
                  columnId,
                  op: filterOpsForType(next.type)[0].value,
                  value: null,
                })
              }}
            />
            <Select
              size="xs"
              w={120}
              data={ops}
              value={filter.op}
              allowDeselect={false}
              onChange={(op) => {
                if (op) updateFilter(index, { op: op as FilterOp, value: null })
              }}
            />
            {needsValue && (
              <CellEditor
                column={column}
                value={filter.value}
                variant="default"
                placeholder="Value"
                onChange={(value) => updateFilter(index, { value })}
              />
            )}
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              aria-label="Remove filter"
              onClick={() => onChange(filters.filter((_, i) => i !== index))}
            >
              <IconX size={14} />
            </ActionIcon>
          </div>
        )
      })}
      <Button
        size="compact-xs"
        variant="subtle"
        color="gray"
        leftSection={<IconFilter size={12} />}
        onClick={addFilter}
      >
        {filters.length === 0 ? 'Filter' : 'Add filter'}
      </Button>
    </div>
  )
}
