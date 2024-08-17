import { NodeViewWrapper } from '@tiptap/react'
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewContent } from '@tiptap/react'

// export default props => {
//   const increase = () => {
//     props.updateAttributes({
//       count: props.node.attrs.count + 1,
//     })
//   }

const Component = (props: any) => {
  const increase = () => {
    props.updateAttributes({
      count: props.node.attrs.count + 1,
    })
  }

  return (
    <NodeViewWrapper className="react-component">
      <span className="label" contentEditable={false}>
        React Component
      </span>

      <NodeViewContent className="content" />
    </NodeViewWrapper>
  )
}

export const Demo = Node.create({
  name: 'reactComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      count: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'react-component',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['react-component', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      addTask: attributes => ({ chain }) => {
        return chain().insertContentAt(0, {
          type: 'task',
        }).run()
      },
    }
  }
})