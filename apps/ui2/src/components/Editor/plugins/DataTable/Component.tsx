import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActionIcon, Skeleton, Table, Text } from '@mantine/core'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCloneDataTable,
  useCreateDataTable,
  useDataTable,
  useUpdateDataTable,
} from '@/hooks/useDataTables'
import { useDropdowns } from '@/hooks/useDropdowns'
import { DataTablePatch } from '@/api/dataTablesApi'
import {
  CellValue,
  DataTable,
  DataTableColumn,
  DataTableSort,
} from '@/types/dataTable'
import type { DataTableOptions } from './Extension'
import { CellEditor } from './CellEditor'
import { ColumnHeader } from './ColumnHeader'
import { FilterBar } from './FilterBar'
import {
  ResolvedColumn,
  applyView,
  coerceValue,
  isEmptyValue,
  resolveSelectLabel,
} from './view'

const PATCH_DEBOUNCE_MS = 450

export function Component(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props
  const tableId = node.attrs.tableId as string
  const cloneFrom = node.attrs.cloneFrom as string
  // noteId comes from the plugin's mutable storage (kept in sync by Editor.tsx),
  // falling back to the configured option.
  const noteId =
    (editor.storage?.dataTable?.noteId as string | undefined) ??
    (props.extension.options as DataTableOptions).noteId

  const createdRef = useRef(false)
  const queryClient = useQueryClient()
  const createTable = useCreateDataTable()
  const cloneTable = useCloneDataTable()
  const updateTable = useUpdateDataTable()
  const { data: table, isError } = useDataTable(tableId)
  const { data: dropdowns } = useDropdowns()

  // Resolve select columns' options for rendering: a column linked to a
  // Dropdown definition gets that dropdown's options (cells store option ids,
  // so renames in the Dropdown config propagate here automatically).
  const resolvedColumns: ResolvedColumn[] = useMemo(() => {
    if (!table) return []
    return table.columns.map((column) => {
      if (column.type !== 'select' || !column.dropdownId) return column
      const dropdown = dropdowns?.find((d) => d.id === column.dropdownId)
      return {
        ...column,
        resolvedOptions: (dropdown?.options ?? []).map((option) => ({
          value: option.id,
          label: option.label,
          color: option.color,
        })),
      }
    })
  }, [table, dropdowns])

  // Lazily create the backing row for a freshly inserted placement, or clone
  // the source when the dedup plugin flagged this node as a duplicate, then
  // persist the new id back onto the node. Uses mutateAsync, not mutate with
  // callbacks: per-call callbacks are dropped if the React component unmounts
  // mid-flight (StrictMode's double-mount does this on every insert), while a
  // promise always resolves — and updateAttributes belongs to the TipTap
  // NodeView, which survives React remounts.
  useEffect(() => {
    if (!tableId && noteId && !createdRef.current) {
      createdRef.current = true
      const create = cloneFrom
        ? // Source gone (e.g. pasted into another note after the original was
          // deleted) — fall back to a fresh table.
          cloneTable
            .mutateAsync({ noteId, sourceId: cloneFrom })
            .catch(() => createTable.mutateAsync({ noteId }))
        : createTable.mutateAsync({ noteId })
      create
        .then((created) =>
          updateAttributes({ tableId: created.id, cloneFrom: '' }),
        )
        .catch(() => {
          // Creation failed; the mutation hooks already notified the user.
        })
    }
  }, [tableId, cloneFrom, noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Persistence: optimistic cache update + debounced PATCH ----------------

  const pendingRef = useRef<DataTablePatch>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    timerRef.current = null
    const patch = pendingRef.current
    pendingRef.current = {}
    if (tableId && Object.keys(patch).length > 0) {
      updateTable.mutate({ id: tableId, patch })
    }
  }, [tableId]) // eslint-disable-line react-hooks/exhaustive-deps

  const apply = useCallback(
    (patch: DataTablePatch) => {
      if (!tableId) return
      queryClient.setQueryData(
        ['dataTable', tableId],
        (prev: DataTable | undefined) => (prev ? { ...prev, ...patch } : prev),
      )
      pendingRef.current = { ...pendingRef.current, ...patch }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, PATCH_DEBOUNCE_MS)
    },
    [tableId, flush, queryClient],
  )

  // Flush pending changes on unmount (e.g. the note is closed mid-debounce).
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        flush()
      }
    },
    [flush],
  )

  // ---- Edit operations --------------------------------------------------------

  const setCell = (rowId: string, columnId: string, value: CellValue) => {
    if (!table) return
    apply({
      rows: table.rows.map((row) =>
        row.id === rowId
          ? { ...row, cells: { ...row.cells, [columnId]: value } }
          : row,
      ),
    })
  }

  const addRow = () => {
    if (!table) return
    apply({ rows: [...table.rows, { id: crypto.randomUUID(), cells: {} }] })
  }

  const deleteRow = (rowId: string) => {
    if (!table) return
    apply({ rows: table.rows.filter((row) => row.id !== rowId) })
  }

  const addColumn = () => {
    if (!table) return
    apply({
      columns: [
        ...table.columns,
        {
          id: crypto.randomUUID(),
          name: `Column ${table.columns.length + 1}`,
          type: 'text',
        },
      ],
    })
  }

  const updateColumn = (columnId: string, changes: Partial<DataTableColumn>) => {
    if (!table) return
    const previous = table.columns.find((column) => column.id === columnId)
    if (!previous) return
    // The enriched view of the column being changed — needed to turn stored
    // option ids back into labels before any remapping.
    const previousResolved =
      resolvedColumns.find((column) => column.id === columnId) ?? previous
    const nextColumns = table.columns.map((column) =>
      column.id === columnId ? { ...column, ...changes } : column,
    )
    const patch: DataTablePatch = { columns: nextColumns }

    const nextType =
      changes.type && changes.type !== previous.type ? changes.type : null
    const sourceChanged =
      'dropdownId' in changes && changes.dropdownId !== previous.dropdownId

    // Remap existing values best-effort so they stay meaningful under the new
    // type or option source (what doesn't map becomes empty rather than wrong):
    // values resolve to their visible label first, then a type change coerces
    // the label, and a source change matches it against the new options.
    if (nextType || sourceChanged) {
      const targetOptions =
        sourceChanged && changes.dropdownId
          ? dropdowns?.find((d) => d.id === changes.dropdownId)?.options ?? []
          : null
      patch.rows = table.rows.map((row) => {
        const raw = row.cells[columnId]
        if (isEmptyValue(raw)) return row
        const label = resolveSelectLabel(raw, previousResolved)
        let next: CellValue
        if (nextType) {
          next = coerceValue(label, nextType)
        } else if (targetOptions) {
          const match = targetOptions.find(
            (option) => option.label.toLowerCase() === label.toLowerCase(),
          )
          next = match ? match.id : null
        } else {
          // Linked dropdown -> custom options: keep the visible label.
          next = label
        }
        return { ...row, cells: { ...row.cells, [columnId]: next } }
      })
      // Switching to custom options seeds the editable list with the labels
      // the column was already showing.
      if (
        sourceChanged &&
        !changes.dropdownId &&
        previousResolved.resolvedOptions?.length
      ) {
        patch.columns = nextColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                options: previousResolved.resolvedOptions?.map((o) => o.label),
              }
            : column,
        )
      }
    }
    apply(patch)
  }

  const deleteColumn = (columnId: string) => {
    if (!table || table.columns.length <= 1) return
    const patch: DataTablePatch = {
      columns: table.columns.filter((column) => column.id !== columnId),
      rows: table.rows.map((row) => {
        const { [columnId]: _removed, ...cells } = row.cells
        return { ...row, cells }
      }),
    }
    if (table.sort?.columnId === columnId) patch.sort = null
    if (table.filters.some((filter) => filter.columnId === columnId)) {
      patch.filters = table.filters.filter(
        (filter) => filter.columnId !== columnId,
      )
    }
    apply(patch)
  }

  const cycleSort = (columnId: string) => {
    if (!table) return
    const current = table.sort
    let next: DataTableSort | null
    if (!current || current.columnId !== columnId) {
      next = { columnId, direction: 'asc' }
    } else if (current.direction === 'asc') {
      next = { columnId, direction: 'desc' }
    } else {
      next = null
    }
    apply({ sort: next })
  }

  // ---- Rendering ----------------------------------------------------------------

  // The persisted sort/filter shape what is rendered, never the stored rows.
  const viewRows = useMemo(
    () =>
      table
        ? applyView(table.rows, resolvedColumns, table.filters, table.sort)
        : [],
    [table, resolvedColumns],
  )

  const wrap = (child: React.ReactNode) => (
    <NodeViewWrapper className="data-table-component">
      <div contentEditable={false} className="data-table">
        {child}
      </div>
    </NodeViewWrapper>
  )

  if (isError || (!tableId && !noteId)) {
    return wrap(
      <Text size="sm" c="dimmed" className="data-table__placeholder">
        This data table was deleted
      </Text>,
    )
  }

  if (!table) {
    return wrap(
      <div className="data-table__placeholder data-table__placeholder--loading">
        <Skeleton height={10} width="38%" radius="xl" />
        <Skeleton height={10} width="74%" radius="xl" />
        <Skeleton height={10} width="56%" radius="xl" />
      </div>,
    )
  }

  const filteredOut = table.rows.length - viewRows.length

  return wrap(
    <>
      <div className="data-table__toolbar">
        <span data-drag-handle className="data-table__grip" title="Drag to move">
          <IconGripVertical size={14} />
        </span>
        <FilterBar
          columns={resolvedColumns}
          filters={table.filters}
          onChange={(filters) => apply({ filters })}
        />
        {filteredOut > 0 && (
          <Text size="xs" c="dimmed" className="data-table__hidden-count">
            {filteredOut} hidden
          </Text>
        )}
      </div>
      <div className="data-table__card">
        <Table className="data-table__table">
          <Table.Thead>
            <Table.Tr>
              {resolvedColumns.map((column) => (
                <Table.Th
                  key={column.id}
                  // Explicit per-column width so the data columns share the
                  // card evenly regardless of cell content.
                  style={{ width: `${(100 / resolvedColumns.length).toFixed(3)}%` }}
                >
                  <ColumnHeader
                    column={column}
                    sort={table.sort}
                    onSortCycle={() => cycleSort(column.id)}
                    onUpdate={(changes) => updateColumn(column.id, changes)}
                    onDelete={() => deleteColumn(column.id)}
                    canDelete={table.columns.length > 1}
                  />
                </Table.Th>
              ))}
              <Table.Th className="data-table__actions-col">
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={addColumn}
                  aria-label="Add column"
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {viewRows.map((row) => (
              <Table.Tr key={row.id}>
                {resolvedColumns.map((column) => (
                  <Table.Td
                    key={column.id}
                    className={
                      column.type === 'number' ? 'data-table__td--number' : undefined
                    }
                  >
                    <CellEditor
                      column={column}
                      value={row.cells[column.id]}
                      onChange={(value) => setCell(row.id, column.id, value)}
                    />
                  </Table.Td>
                ))}
                <Table.Td className="data-table__actions-col">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    className="data-table__row-delete"
                    onClick={() => deleteRow(row.id)}
                    aria-label="Delete row"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {viewRows.length === 0 && table.rows.length > 0 && (
              <Table.Tr>
                <Table.Td colSpan={table.columns.length + 1}>
                  <Text size="sm" c="dimmed" ta="center">
                    No rows match the current filters
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            <Table.Tr className="data-table__new-row" onClick={addRow}>
              <Table.Td colSpan={table.columns.length + 1}>
                <span className="data-table__new-row-label">
                  <IconPlus size={12} />
                  New row
                </span>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </>,
  )
}
