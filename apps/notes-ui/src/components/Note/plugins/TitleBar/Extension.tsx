import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Component } from './Component'

export const TAG_NAME = 'title-bar';

export const TitleBarExtension = Node.create({
  name: TAG_NAME,

  group: 'block',

  atom: true,

  draggable: false,

  onDestroy: () => {
    console.log('destroy');
  },

  parseHTML() {
    return [
      {
        tag: TAG_NAME,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [TAG_NAME, mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setQuestion: () => ({ chain }) => {
        return chain().insertContentAt(0, {
          type: TAG_NAME,
        }).run()
      },
    }
  }
})
