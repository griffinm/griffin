import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Popover,
  Select,
  Stack,
  TagsInput,
  TextInput,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconChevronDown,
  IconHash,
  IconLetterCase,
  IconSelect,
  IconTrash,
  type TablerIcon,
} from '@tabler/icons-react'
import { useDropdowns } from '@/hooks/useDropdowns'
import { ColumnType, DataTableColumn, DataTableSort } from '@/types/dataTable'

const COLUMN_TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
]

/** A tiny glyph per column type so a column's shape is legible at a glance. */
const TYPE_GLYPHS: Record<ColumnType, TablerIcon> = {
  text: IconLetterCase,
  number: IconHash,
  date: IconCalendar,
  select: IconSelect,
}

/** Sentinel for the "type the options yourself" source (vs. a Dropdown id). */
const CUSTOM_SOURCE = 'custom'

/**
 * Header cell content: the column name cycles the sort (none -> asc -> desc),
 * and a chevron opens the column's configuration popover.
 */
export function ColumnHeader({
  column,
  sort,
  onSortCycle,
  onUpdate,
  onDelete,
  canDelete,
}: {
  column: DataTableColumn
  sort: DataTableSort | null
  onSortCycle: () => void
  onUpdate: (_changes: Partial<DataTableColumn>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [configOpened, setConfigOpened] = useState(false)
  const { data: dropdowns } = useDropdowns()
  const isSorted = sort?.columnId === column.id

  const sourceOptions = [
    { value: CUSTOM_SOURCE, label: 'Custom options' },
    ...(dropdowns ?? []).map((d) => ({ value: d.id, label: d.name })),
  ]
  // A linked dropdown that no longer exists still needs a visible entry.
  if (
    column.dropdownId &&
    dropdowns &&
    !dropdowns.some((d) => d.id === column.dropdownId)
  ) {
    sourceOptions.push({ value: column.dropdownId, label: '(deleted dropdown)' })
  }

  const TypeGlyph = TYPE_GLYPHS[column.type]

  return (
    <div className="data-table__header">
      <button
        type="button"
        className={`data-table__header-name${isSorted ? ' is-sorted' : ''}`}
        onClick={onSortCycle}
        title="Sort by this column"
      >
        <TypeGlyph size={11} className="data-table__type-glyph" />
        <span>{column.name}</span>
        {isSorted &&
          (sort.direction === 'asc' ? (
            <IconArrowUp size={11} />
          ) : (
            <IconArrowDown size={11} />
          ))}
      </button>
      <Popover
        opened={configOpened}
        onChange={setConfigOpened}
        position="bottom-start"
        withinPortal
        trapFocus
        shadow="md"
      >
        <Popover.Target>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => setConfigOpened((o) => !o)}
            aria-label="Configure column"
          >
            <IconChevronDown size={12} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs" w={220}>
            <TextInput
              size="xs"
              label="Name"
              value={column.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
            <Select
              size="xs"
              label="Type"
              data={COLUMN_TYPE_OPTIONS}
              value={column.type}
              allowDeselect={false}
              // Keep the listbox inside the popover's DOM: portaled options
              // register as an outside click and close the whole popover.
              comboboxProps={{ withinPortal: false }}
              onChange={(value) => {
                if (value && value !== column.type) {
                  onUpdate({ type: value as ColumnType })
                }
              }}
            />
            {column.type === 'select' && (
              <Select
                size="xs"
                label="Options source"
                data={sourceOptions}
                value={column.dropdownId ?? CUSTOM_SOURCE}
                allowDeselect={false}
                comboboxProps={{ withinPortal: false }}
                onChange={(value) => {
                  if (!value) return
                  const next = value === CUSTOM_SOURCE ? undefined : value
                  if (next !== column.dropdownId) {
                    onUpdate({ dropdownId: next })
                  }
                }}
              />
            )}
            {column.type === 'select' && !column.dropdownId && (
              <TagsInput
                size="xs"
                label="Options"
                placeholder="Add option"
                comboboxProps={{ withinPortal: false }}
                value={column.options ?? []}
                onChange={(options) => onUpdate({ options })}
              />
            )}
            <Button
              size="xs"
              color="red"
              variant="light"
              leftSection={<IconTrash size={14} />}
              disabled={!canDelete}
              onClick={() => {
                setConfigOpened(false)
                onDelete()
              }}
            >
              Delete column
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  )
}
