import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import {
  IconFileText,
  IconChevronDown,
  IconTerminal2,
  IconHelp,
  IconCheckbox,
  IconTable,
  type TablerIcon,
} from '@tabler/icons-react'

/** An entry in the "@" actions menu (stage 1 of the popup). */
export interface EditorAction {
  id: string
  label: string
  Icon: TablerIcon
}

// The list of actions offered when the user types "@". Add new entries here;
// AtMenuList branches on `action.id` to decide what selecting one does.
export const EDITOR_ACTIONS: EditorAction[] = [
  { id: 'link-note', label: 'Link To Note', Icon: IconFileText },
  { id: 'dropdown', label: 'Dropdown', Icon: IconChevronDown },
  { id: 'prompt', label: 'Prompt', Icon: IconTerminal2 },
  { id: 'question', label: 'Question', Icon: IconHelp },
  { id: 'task', label: 'Task', Icon: IconCheckbox },
  { id: 'table', label: 'Table', Icon: IconTable },
]

export interface ActionMenuListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean
}

interface ActionMenuListProps {
  /** Text typed after the "@" trigger — filters the action list. */
  query: string
  /** Invoked with the chosen action (Enter or click). */
  onSelect: (_action: EditorAction) => void
}

export const ActionMenuList = forwardRef<ActionMenuListRef, ActionMenuListProps>(
  ({ query, onSelect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Command-palette style: narrow the actions by a case-insensitive substring
    // of whatever has been typed after "@" (empty query shows everything).
    const q = query.toLowerCase()
    const actions = EDITOR_ACTIONS.filter((a) => a.label.toLowerCase().includes(q))

    useEffect(() => {
      setSelectedIndex(0)
    }, [query])

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) => {
          if (actions.length === 0) return false
          if (event.key === 'ArrowUp') {
            setSelectedIndex((i) => (i + actions.length - 1) % actions.length)
            return true
          }
          if (event.key === 'ArrowDown') {
            setSelectedIndex((i) => (i + 1) % actions.length)
            return true
          }
          if (event.key === 'Enter') {
            const action = actions[selectedIndex]
            if (action) onSelect(action)
            return true
          }
          return false
        },
      }),
      [actions, selectedIndex, onSelect],
    )

    return (
      <div className="w-80 max-h-80 overflow-y-auto bg-[var(--mantine-color-body)] border border-[var(--mantine-color-gray-3)] rounded-md shadow-lg">
        {actions.length === 0 ? (
          <div className="p-3 text-sm text-[var(--mantine-color-dimmed)]">
            No actions
          </div>
        ) : (
          actions.map((action, index) => (
            <div
              key={action.id}
              // Keep the editor focused so the transition keeps the suggestion alive.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(action)}
              className={`flex items-center gap-2 p-2 cursor-pointer border-b border-[var(--mantine-color-gray-1)] last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-[var(--mantine-color-default-hover)]'
                  : 'hover:bg-[var(--mantine-color-default-hover)]'
              }`}
            >
              <action.Icon
                size={14}
                className="text-[var(--mantine-color-dimmed)] flex-shrink-0"
              />
              <span className="font-medium text-sm truncate">{action.label}</span>
            </div>
          ))
        )}
      </div>
    )
  },
)

ActionMenuList.displayName = 'ActionMenuList'
