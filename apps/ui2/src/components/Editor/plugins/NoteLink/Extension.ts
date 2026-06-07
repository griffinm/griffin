import Mention from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import { noteLinkSuggestionRender } from './suggestion'

export const NoteLinkPluginKey = new PluginKey('noteLink')

/**
 * Inline node that links to another note the user owns. Built on top of the
 * Mention extension: typing "@" opens a suggestion popup (search Typesense or
 * paste a note URL — see `NoteLinkList`). The node renders as a styled "pill"
 * (`.note-link-pill`) so it displays consistently in both the editor and in
 * read-only HTML previews (HtmlPreview), and round-trips via the inherited
 * `span[data-type="noteLink"]` parse rule.
 */
export const NoteLinkExtension = Mention.extend({
  name: 'noteLink',
}).configure({
  HTMLAttributes: {
    class: 'note-link-pill',
  },
  // Render just the note title; the Mention node method wraps this string in a
  // `<span data-type="noteLink" data-id=.. data-label=..>` so it parses back.
  renderHTML({ node }) {
    return node.attrs.label ?? node.attrs.id ?? ''
  },
  renderText({ node }) {
    return node.attrs.label ?? node.attrs.id ?? ''
  },
  suggestion: {
    char: '@',
    pluginKey: NoteLinkPluginKey,
    // Items are resolved inside the React popup (debounced search / URL lookup),
    // so the suggestion utility itself returns nothing.
    items: () => [],
    render: noteLinkSuggestionRender,
    command: ({ editor, range, props }) => {
      // Re-implemented from Mention's default command (configure() replaces the
      // whole suggestion object, so the default command is not inherited).
      const nodeAfter = editor.view.state.selection.$to.nodeAfter
      const overrideSpace = nodeAfter?.text?.startsWith(' ')
      if (overrideSpace) {
        range.to += 1
      }
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: 'noteLink', attrs: props },
          { type: 'text', text: ' ' },
        ])
        .run()
      window.getSelection()?.collapseToEnd()
    },
    allow: ({ state, range }) => {
      const $from = state.doc.resolve(range.from)
      const type = state.schema.nodes.noteLink
      return !!$from.parent.type.contentMatch.matchType(type)
    },
  },
})
