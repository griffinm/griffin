import { useEffect, useRef, useState } from 'react'
import { Menu, NumberInput, Select, Text, TextInput, Textarea } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCheck, IconX } from '@tabler/icons-react'
import '@mantine/dates/styles.css'
import { getPillStyle } from '@/components/dropdowns/colors'
import { CellValue } from '@/types/dataTable'
import { ResolvedColumn, ResolvedSelectOption, isEmptyValue } from './view'

/**
 * A select cell rendered as the app's dropdown pill: same look and anchored
 * menu as the inline Dropdown plugin, so linked and custom options feel like
 * one system. Empty cells show a quiet dash that invites a click.
 */
function SelectCellPill({
  resolved,
  current,
  onChange,
}: {
  resolved: ResolvedSelectOption[]
  current: string | null
  onChange: (_value: CellValue) => void
}) {
  const [opened, setOpened] = useState(false)
  const active = resolved.find((option) => option.value === current)
  // An orphaned value (option removed / source changed) still renders, dimmed.
  const label = active?.label ?? current

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      offset={4}
      withinPortal
      shadow="md"
      radius="md"
      transitionProps={{ transition: 'pop', duration: 120 }}
    >
      <Menu.Target>
        {current ? (
          <span
            className="dropdown-pill dropdown-pill--interactive"
            style={getPillStyle(active?.color ?? 'gray')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpened((o) => !o)
              }
            }}
          >
            {label}
          </span>
        ) : (
          <span
            className="data-table__select-empty"
            role="button"
            tabIndex={0}
            aria-label="Set value"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpened((o) => !o)
              }
            }}
          >
            —
          </span>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        {resolved.length === 0 ? (
          <Menu.Item disabled>
            <Text size="xs" c="dimmed">
              No options — configure column
            </Text>
          </Menu.Item>
        ) : (
          resolved.map((option) => (
            <Menu.Item
              key={option.value}
              onClick={() => onChange(option.value === current ? null : option.value)}
              leftSection={
                <IconCheck
                  size={14}
                  style={{ opacity: option.value === current ? 1 : 0 }}
                />
              }
            >
              <span className="dropdown-pill" style={getPillStyle(option.color ?? 'gray')}>
                {option.label}
              </span>
            </Menu.Item>
          ))
        )}
        {current && (
          <Menu.Item
            leftSection={<IconX size={14} />}
            onClick={() => onChange(null)}
          >
            <Text size="xs" c="dimmed">
              Clear
            </Text>
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}

/**
 * Local draft state for typed cells. The cell's upstream value lives in the
 * React Query cache, which notifies subscribers asynchronously — controlling
 * the input directly from it drops keystrokes under fast typing (the stale
 * controlled value clobbers the DOM between renders). The input is controlled
 * by this synchronous draft instead; upstream changes are applied only when
 * they differ from what we last reported (i.e. a real external change such as
 * a reload or a column type coercion, not the echo of our own edit).
 */
function useDraft(
  value: CellValue | undefined,
  onChange: (_value: CellValue) => void,
): [CellValue, (_value: CellValue) => void] {
  const normalized = value === undefined ? null : value
  const [draft, setDraft] = useState<CellValue>(normalized)
  const lastSentRef = useRef<CellValue>(normalized)

  useEffect(() => {
    if (normalized !== lastSentRef.current) {
      lastSentRef.current = normalized
      setDraft(normalized)
    }
  }, [normalized])

  const update = (next: CellValue) => {
    lastSentRef.current = next
    setDraft(next)
    onChange(next)
  }
  return [draft, update]
}

/**
 * Inline editor for a single cell, choosing the input by column type.
 * Values: text -> string, number -> number, date -> 'YYYY-MM-DD' string,
 * select -> the option string (custom) or the Dropdown option id (linked).
 *
 * `variant: 'unstyled'` is the in-table chrome (pills, borderless inputs);
 * `'default'` is the compact framed look used by the filter chips.
 */
export function CellEditor({
  column,
  value,
  onChange,
  variant = 'unstyled',
  placeholder,
}: {
  column: ResolvedColumn
  value: CellValue | undefined
  onChange: (_value: CellValue) => void
  variant?: 'unstyled' | 'default'
  placeholder?: string
}) {
  // Unconditional so the hook order is stable across column types; date and
  // select cells are click-driven and read `value` directly.
  const [draft, setDraft] = useDraft(value, onChange)

  switch (column.type) {
    case 'number':
      return (
        <NumberInput
          variant={variant}
          size="xs"
          hideControls
          value={typeof draft === 'number' ? draft : ''}
          onChange={(v) => setDraft(typeof v === 'number' ? v : v ? Number(v) : null)}
          placeholder={placeholder}
        />
      )
    case 'date':
      return (
        <DatePickerInput
          variant={variant}
          size="xs"
          clearable
          valueFormat="MMM D, YYYY"
          value={isEmptyValue(value) ? null : String(value)}
          onChange={(v) => onChange(v || null)}
          placeholder={placeholder}
        />
      )
    case 'select': {
      const resolved: ResolvedSelectOption[] =
        column.resolvedOptions ??
        (column.options ?? []).map((option) => ({ value: option, label: option }))
      const current = isEmptyValue(value) ? null : String(value)

      if (variant === 'unstyled') {
        return (
          <SelectCellPill resolved={resolved} current={current} onChange={onChange} />
        )
      }

      // Compact framed Select for the filter chips.
      const data = resolved.map(({ value: v, label }) => ({ value: v, label }))
      if (current && !resolved.some((option) => option.value === current)) {
        data.push({ value: current, label: current })
      }
      return (
        <Select
          variant={variant}
          size="xs"
          data={data}
          value={current}
          onChange={(v) => onChange(v ?? null)}
          clearable
          placeholder={placeholder ?? (data.length === 0 ? 'No options' : undefined)}
        />
      )
    }
    default:
      // In-table text cells are multi-line: Enter inserts a newline and the
      // cell grows (Task's description Textarea is the NodeView precedent).
      // The filter chip's value stays a single-line input.
      if (variant === 'unstyled') {
        return (
          <Textarea
            variant="unstyled"
            size="xs"
            autosize
            minRows={1}
            value={isEmptyValue(draft) ? '' : String(draft)}
            onChange={(e) => setDraft(e.target.value === '' ? null : e.target.value)}
            placeholder={placeholder}
            // Keep keystrokes inside the cell: without this, ProseMirror sees
            // the bubbled Enter, handles it itself, and pulls focus out of the
            // textarea mid-typing.
            onKeyDown={(e) => e.stopPropagation()}
          />
        )
      }
      return (
        <TextInput
          variant={variant}
          size="xs"
          value={isEmptyValue(draft) ? '' : String(draft)}
          onChange={(e) => setDraft(e.target.value === '' ? null : e.target.value)}
          placeholder={placeholder}
        />
      )
  }
}
