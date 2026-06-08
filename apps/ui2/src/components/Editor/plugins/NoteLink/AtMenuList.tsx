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

export interface AtMenuListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean
}

/**
 * Two-stage popup mounted by the "@" suggestion (see `suggestion.ts`):
 * stage 1 is the actions menu (`ActionMenuList`), stage 2 is the note search
 * (`NoteLinkList`). Selecting "Link To Note" clears the typed filter text and
 * switches to the search. Keyboard events are routed to the active stage.
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

type Mode = 'actions' | 'noteLink'

export const AtMenuList = forwardRef<AtMenuListRef, AtMenuListProps>(
  ({ query, command, editor, range }, ref) => {
    const [mode, setMode] = useState<Mode>('actions')
    const actionListRef = useRef<ActionMenuListRef>(null)
    const noteListRef = useRef<NoteLinkListRef>(null)

    const handleActionSelect = (action: EditorAction) => {
      if (action.id === 'link-note') {
        // Drop the action-filter text but keep the "@" (range.from), so the
        // suggestion stays active and stage-2 note search starts from empty.
        if (range.to > range.from + 1) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: range.from + 1, to: range.to })
            .run()
        }
        setMode('noteLink')
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) =>
          mode === 'actions'
            ? actionListRef.current?.onKeyDown(event) ?? false
            : noteListRef.current?.onKeyDown(event) ?? false,
      }),
      [mode],
    )

    return mode === 'actions' ? (
      <ActionMenuList
        ref={actionListRef}
        query={query}
        onSelect={handleActionSelect}
      />
    ) : (
      <NoteLinkList ref={noteListRef} query={query} command={command} />
    )
  },
)

AtMenuList.displayName = 'AtMenuList'
