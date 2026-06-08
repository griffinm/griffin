import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useDropdowns } from '@/hooks/useDropdowns'
import { defaultColorOf, dotStyle } from '@/components/dropdowns/colors'
import { MenuPanel, MenuRow, MenuStatus } from './MenuPrimitives'

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
    <MenuPanel label="Dropdowns">
      {items.length === 0 ? (
        <MenuStatus>
          {dropdowns && dropdowns.length === 0
            ? 'No dropdowns configured yet'
            : 'No matching dropdowns'}
        </MenuStatus>
      ) : (
        items.map((item, index) => (
          <MenuRow
            key={item.id}
            selected={index === selectedIndex}
            onSelect={() => onSelect(item.id)}
            leading={<span style={dotStyle(defaultColorOf(item))} />}
            title={item.name}
          />
        ))
      )}
    </MenuPanel>
  )
})

DropdownPickerList.displayName = 'DropdownPickerList'
