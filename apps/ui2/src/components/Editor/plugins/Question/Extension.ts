import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Component } from './Component'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    question: {
      setQuestion: () => ReturnType
    }
  }
}

export const QuestionExtension = Node.create({
  name: 'question',

  group: 'block',

  atom: true,

  addInputRules() {
    return [
      nodeInputRule({
        find: /qq/,
        type: this.type,
      })
    ]
  },

  addAttributes() {
    return {
      questionId: {
        default: "",
      },
      questionContent: {
        default: "",
      },
      questionAnswer: {
        default: "",
      }
    }
  },

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'question',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['question', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setQuestion: () => ({ chain }) => {
        return chain().insertContent({
          type: 'question',
        }).run()
      },
    }
  }
})

