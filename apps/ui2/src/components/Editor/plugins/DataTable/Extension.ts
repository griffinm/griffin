import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Component } from './Component'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dataTable: {
      /** Insert a new data table placement (the NodeView creates the backing row). */
      setDataTable: () => ReturnType
    }
  }
}

export interface DataTableOptions {
  /** The note this editor is editing; needed to create the backing row. */
  noteId?: string
}

const dataTableDedupeKey = new PluginKey('dataTableDedupe')

/**
 * Block node that places a structured, sortable/filterable data table in a
 * note. It stores only a reference: `tableId`, the DataTable row holding the
 * typed columns, rows, and the applied sort/filter. The NodeView creates the
 * row lazily on mount when `tableId` is empty.
 *
 * Round-trips as `<datatable tableid="..">` so the backend
 * (`associateDataTables`) can prune tables dropped from the content.
 */
export const DataTableExtension = Node.create<DataTableOptions>({
  name: 'dataTable',

  group: 'block',

  atom: true,

  draggable: true,

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
      tableId: {
        default: '',
      },
      // Transient: set by the dedup plugin when a placement is duplicated so
      // the NodeView clones the source table instead of creating an empty one.
      cloneFrom: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'datatable',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['datatable', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setDataTable:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { tableId: '', cloneFrom: '' },
            })
            .run()
        },
    }
  },

  // Keep every placement independent: when a node is duplicated (copy/paste)
  // two nodes end up sharing one `tableId`. Unlike Dropdown (whose duplicates
  // reset to default state), a duplicated table should keep its data, so the
  // later duplicate records the original id in `cloneFrom` and the NodeView
  // deep-copies it into a fresh row. Empty ids are skipped (a just-inserted
  // node), which also prevents an update loop.
  addProseMirrorPlugins() {
    const nodeType = this.type
    return [
      new Plugin({
        key: dataTableDedupeKey,
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null

          const seen = new Set<string>()
          const duplicates: number[] = []
          newState.doc.descendants((node, pos) => {
            if (node.type !== nodeType) return
            const id = node.attrs.tableId
            if (!id) return
            if (seen.has(id)) duplicates.push(pos)
            else seen.add(id)
          })

          if (duplicates.length === 0) return null

          const tr = newState.tr
          duplicates.forEach((pos) => {
            const node = tr.doc.nodeAt(pos)
            if (node) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                tableId: '',
                cloneFrom: node.attrs.tableId,
              })
            }
          })
          return tr
        },
      }),
    ]
  },
})
