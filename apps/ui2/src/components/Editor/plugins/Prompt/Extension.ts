import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Component } from './Component'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    prompt: {
      setPrompt: () => ReturnType
    }
  }
}

export const PromptExtension = Node.create({
  name: 'prompt',

  group: 'block',

  atom: true,

  draggable: true,

  addInputRules() {
    return [
      nodeInputRule({
        find: /\/prompt\s$/,
        type: this.type,
      })
    ]
  },

  addAttributes() {
    return {
      title: {
        default: 'Untitled Prompt',
      },
      status: {
        default: 'draft', // draft | ready | running | done
      },
      content: {
        default: '',
      },
      collapsed: {
        default: false,
        parseHTML: element => element.getAttribute('collapsed') === 'true',
        renderHTML: attributes => ({
          collapsed: attributes.collapsed ? 'true' : 'false',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'prompt',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['prompt', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setPrompt: () => ({ chain }) => {
        return chain().insertContent({
          type: 'prompt',
        }).run()
      },
    }
  }
})
