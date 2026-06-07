import { ReactRenderer } from '@tiptap/react'
import type {
  SuggestionOptions,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import { NoteLinkList, type NoteLinkListRef } from './NoteLinkList'

/**
 * Suggestion `render` lifecycle for the note-link popup. Mounts `NoteLinkList`
 * via TipTap's `ReactRenderer` (so it inherits the editor's React context —
 * Mantine/MUI providers) and positions it at the caret using `clientRect`.
 * This replaces the `tippy.js` dependency used in the canonical TipTap example.
 */
export const noteLinkSuggestionRender: SuggestionOptions['render'] = () => {
  let component: ReactRenderer<NoteLinkListRef> | null = null
  let popup: HTMLDivElement | null = null
  let dismissed = false

  const updatePosition = (clientRect?: (() => DOMRect | null) | null) => {
    if (!popup || !clientRect) return
    const rect = clientRect()
    if (!rect) return
    popup.style.left = `${rect.left + window.scrollX}px`
    popup.style.top = `${rect.bottom + window.scrollY + 4}px`
  }

  return {
    onStart: (props: SuggestionProps) => {
      dismissed = false
      component = new ReactRenderer(NoteLinkList, {
        props,
        editor: props.editor,
      })

      popup = document.createElement('div')
      popup.className = 'note-link-popup'
      popup.style.position = 'absolute'
      popup.style.zIndex = '10000'
      popup.appendChild(component.element)
      document.body.appendChild(popup)

      updatePosition(props.clientRect)
    },

    onUpdate: (props: SuggestionProps) => {
      component?.updateProps(props)
      if (dismissed) return
      updatePosition(props.clientRect)
    },

    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'Escape') {
        dismissed = true
        if (popup) popup.style.display = 'none'
        return true
      }
      return component?.ref?.onKeyDown(props.event) ?? false
    },

    onExit: () => {
      popup?.remove()
      popup = null
      component?.destroy()
      component = null
    },
  }
}
