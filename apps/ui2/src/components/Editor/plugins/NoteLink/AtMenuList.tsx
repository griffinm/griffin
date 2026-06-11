import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { Editor } from '@tiptap/core'
import {
  ActionMenuList,
  type ActionMenuListRef,
  type EditorAction,
} from './ActionMenuList'
import { NoteLinkList, type NoteLinkListRef } from './NoteLinkList'
import {
  DropdownPickerList,
  type DropdownPickerListRef,
} from './DropdownPickerList'
import { createDropdownInstance } from '@/api/dropdownsApi'

export interface AtMenuListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean
}

/**
 * Multi-stage popup mounted by the "@" suggestion (see `suggestion.ts`):
 * stage 1 is the actions menu (`ActionMenuList`). "Link To Note" and "Dropdown"
 * switch to a stage-2 list — note search (`NoteLinkList`) or dropdown picker
 * (`DropdownPickerList`). The remaining actions (Prompt, Question, Task, Table,
 * Data Table) insert their node directly and dismiss the popup. Keyboard events
 * are routed to the active stage.
 */
interface AtMenuListProps {
  /** Text typed after the "@" trigger. */
  query: string
  /** Inserts the note-link node for the chosen note (stage 2). */
  command: (_item: { id: string; label: string }) => void
  editor: Editor
  /** Document range covered by the suggestion (`@` + query). */
  range: { from: number; to: number }
}

type Mode = 'actions' | 'noteLink' | 'dropdown'

export const AtMenuList = forwardRef<AtMenuListRef, AtMenuListProps>(
  ({ query, command, editor, range }, ref) => {
    const [mode, setMode] = useState<Mode>('actions')
    const actionListRef = useRef<ActionMenuListRef>(null)
    const noteListRef = useRef<NoteLinkListRef>(null)
    const dropdownListRef = useRef<DropdownPickerListRef>(null)

    const handleActionSelect = (action: EditorAction) => {
      switch (action.id) {
        case 'link-note':
        case 'dropdown': {
          // Drop the action-filter text but keep the "@" (range.from), so the
          // suggestion stays active and the stage-2 list starts from empty.
          if (range.to > range.from + 1) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: range.from + 1, to: range.to })
              .run()
          }
          setMode(action.id === 'link-note' ? 'noteLink' : 'dropdown')
          break
        }
        case 'prompt':
        case 'question':
        case 'task':
        case 'dataTable':
          // Direct insert (no stage 2): replacing the whole suggestion range
          // ("@" + query) drops in the atom block node and, by removing the
          // "@", ends the suggestion and dismisses the popup.
          editor
            .chain()
            .focus()
            .insertContentAt(range, { type: action.id })
            .run()
          break
        case 'table':
          // Tables have no single node `type`, so use the insertTable command
          // after clearing the suggestion range (matches MenuButtonAddTable).
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
          break
      }
    }

    // Replace the whole suggestion range ("@" + query) with a dropdown node.
    // Removing the "@" ends the suggestion, which dismisses the popup. The
    // instance is created up front (noteId comes from the Dropdown plugin's
    // storage, kept current by Editor.tsx) so the node carries its instanceId.
    const insertDropdown = async (dropdownId: string) => {
      const noteId = editor.storage?.dropdown?.noteId as string | undefined
      let instanceId = ''
      if (noteId) {
        try {
          const instance = await createDropdownInstance({ dropdownId, noteId })
          instanceId = instance.id
        } catch {
          instanceId = ''
        }
      }
      editor
        .chain()
        .focus()
        .insertContentAt(range, {
          type: 'dropdown',
          attrs: { dropdownId, instanceId },
        })
        .run()
    }

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) => {
          if (mode === 'actions') {
            return actionListRef.current?.onKeyDown(event) ?? false
          }
          if (mode === 'noteLink') {
            return noteListRef.current?.onKeyDown(event) ?? false
          }
          return dropdownListRef.current?.onKeyDown(event) ?? false
        },
      }),
      [mode],
    )

    if (mode === 'actions') {
      return (
        <ActionMenuList
          ref={actionListRef}
          query={query}
          onSelect={handleActionSelect}
        />
      )
    }
    if (mode === 'noteLink') {
      return <NoteLinkList ref={noteListRef} query={query} command={command} />
    }
    return (
      <DropdownPickerList
        ref={dropdownListRef}
        query={query}
        onSelect={insertDropdown}
      />
    )
  },
)

AtMenuList.displayName = 'AtMenuList'
