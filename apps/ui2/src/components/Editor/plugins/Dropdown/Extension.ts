import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Component } from './Component'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dropdown: {
      /** Insert a new dropdown placement bound to the given definition. */
      setDropdown: (_dropdownId: string) => ReturnType
    }
  }
}

export interface DropdownOptions {
  /** The note this editor is editing; needed to create instance rows. */
  noteId?: string
}

const dropdownDedupeKey = new PluginKey('dropdownInstanceDedupe')

/**
 * Block node that places a reusable dropdown in a note. It stores only a
 * reference: `dropdownId` (the definition) and `instanceId` (the per-placement
 * row that tracks the selected option, loaded with the note). The NodeView
 * creates the instance lazily on mount when `instanceId` is empty.
 *
 * Round-trips as `<dropdown dropdownid=".." instanceid="..">` so the backend
 * (`associateDropdownInstances`) can prune instances dropped from the content.
 */
export const DropdownExtension = Node.create<DropdownOptions>({
  name: 'dropdown',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      noteId: undefined,
    }
  },

  // Mirror noteId into mutable storage so NodeViews always read the current note
  // (the editor is created once, but Editor.tsx keeps this in sync via an effect).
  addStorage() {
    return {
      noteId: this.options.noteId as string | undefined,
    }
  },

  addAttributes() {
    return {
      dropdownId: {
        default: '',
      },
      instanceId: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'dropdown',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['dropdown', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setDropdown:
        (dropdownId: string) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { dropdownId, instanceId: '' },
            })
            .run()
        },
    }
  },

  // Keep every placement independent: when a node is duplicated (copy/paste)
  // two nodes end up sharing one `instanceId`. Reset the later duplicate's
  // `instanceId` to '' so its NodeView mints a fresh instance. Empty ids are
  // skipped (a just-inserted node), which also prevents an update loop.
  addProseMirrorPlugins() {
    const nodeType = this.type
    return [
      new Plugin({
        key: dropdownDedupeKey,
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null

          const seen = new Set<string>()
          const duplicates: number[] = []
          newState.doc.descendants((node, pos) => {
            if (node.type !== nodeType) return
            const id = node.attrs.instanceId
            if (!id) return
            if (seen.has(id)) duplicates.push(pos)
            else seen.add(id)
          })

          if (duplicates.length === 0) return null

          const tr = newState.tr
          duplicates.forEach((pos) => {
            const node = tr.doc.nodeAt(pos)
            if (node) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, instanceId: '' })
            }
          })
          return tr
        },
      }),
    ]
  },
})
