import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useDropdowns } from '@/hooks/useDropdowns'
import { defaultColorOf, dotStyle } from '@/components/dropdowns/colors'

export interface DropdownPickerListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean
}

interface DropdownPickerListProps {
  /** Text typed after the "@" trigger — filters the dropdown list. */
  query: string
  /** Inserts a placement for the chosen dropdown definition. */
  onSelect: (_dropdownId: string) => void
}

/**
 * Stage-2 list for the "@ → Dropdown" action: lists the user's dropdown
 * definitions and inserts a placement for the chosen one.
 */
export const DropdownPickerList = forwardRef<
  DropdownPickerListRef,
  DropdownPickerListProps
>(({ query, onSelect }, ref) => {
  const { data: dropdowns } = useDropdowns()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const q = query.toLowerCase()
  const items = (dropdowns ?? []).filter((d) => d.name.toLowerCase().includes(q))

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (items.length === 0) return false
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) onSelect(item.id)
          return true
        }
        return false
      },
    }),
    [items, selectedIndex, onSelect],
  )

  return (
    <div className="w-80 max-h-80 overflow-y-auto bg-[var(--mantine-color-body)] border border-[var(--mantine-color-gray-3)] rounded-md shadow-lg">
      {items.length === 0 ? (
        <div className="p-3 text-sm text-[var(--mantine-color-dimmed)]">
          {dropdowns && dropdowns.length === 0
            ? 'No dropdowns configured yet'
            : 'No matching dropdowns'}
        </div>
      ) : (
        items.map((item, index) => (
          <div
            key={item.id}
            // Keep the editor focused so the insert lands at the suggestion range.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2 p-2 cursor-pointer border-b border-[var(--mantine-color-gray-1)] last:border-b-0 ${
              index === selectedIndex
                ? 'bg-[var(--mantine-color-default-hover)]'
                : 'hover:bg-[var(--mantine-color-default-hover)]'
            }`}
          >
            <span style={dotStyle(defaultColorOf(item))} />
            <span className="font-medium text-sm truncate">{item.name}</span>
          </div>
        ))
      )}
    </div>
  )
})

DropdownPickerList.displayName = 'DropdownPickerList'
