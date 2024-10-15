import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Component } from './Component'

export const TaskExtension = Node.create({
  name: 'task',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      taskId: {
        default: "",
      },
    }
  },

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'task',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['task', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setTask: () => ({ chain }) => {
        return chain().insertContent({
          type: 'task',
        }).run()
      },
    }
  }
})
