import { ReactRenderer } from '@tiptap/react'
import type {
  SuggestionOptions,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import { AtMenuList, type AtMenuListRef } from './AtMenuList'

/**
 * Suggestion `render` lifecycle for the "@" popup. Mounts `AtMenuList` via
 * TipTap's `ReactRenderer` (so it inherits the editor's React context —
 * Mantine/MUI providers) and positions it at the caret using `clientRect`.
 * `AtMenuList` is a two-stage menu: an actions list, then note search.
 * This replaces the `tippy.js` dependency used in the canonical TipTap example.
 */
export const noteLinkSuggestionRender: SuggestionOptions['render'] = () => {
  let component: ReactRenderer<AtMenuListRef> | null = null
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
      component = new ReactRenderer(AtMenuList, {
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
