import { useState } from 'react'
import { Button, TextInput, Textarea, Select, Badge } from '@mantine/core'
import { NodeViewWrapper } from '@tiptap/react'
import { IconChevronRight, IconChevronDown, IconCheck, IconX, IconCopy } from '@tabler/icons-react'
import type { NodeViewProps } from '@tiptap/react'

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
]

const statusColors: Record<string, string> = {
  draft: 'gray',
  ready: 'blue',
  running: 'yellow',
  done: 'green',
}

const statusBgColors: Record<string, string> = {
  draft: 'bg-gray-50',
  ready: 'bg-blue-50',
  running: 'bg-yellow-50',
  done: 'bg-green-50',
}

const statusIcons: Record<string, string> = {
  draft: '🟠',
  ready: '🟡',
  running: '⏳',
  done: '🟢',
}

export function Component(props: NodeViewProps) {
  const { node, updateAttributes } = props
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(node.attrs.title)
  const [editStatus, setEditStatus] = useState(node.attrs.status)
  const [editContent, setEditContent] = useState(node.attrs.content)

  const collapsed = node.attrs.collapsed
  const status = node.attrs.status
  const title = node.attrs.title
  const content = node.attrs.content

  const handleToggleCollapse = () => {
    updateAttributes({ collapsed: !collapsed })
  }

  const handleStartEdit = () => {
    setEditTitle(title)
    setEditStatus(status)
    setEditContent(content)
    setEditing(true)
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateAttributes({
      title: editTitle,
      status: editStatus,
      content: editContent,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const renderHeader = () => (
    <div className="flex items-center gap-2 py-1 px-2 border-1 border-gray-200 cursor-pointer select-none text-2xl">
      <button
        type="button"
        onClick={handleToggleCollapse}
        className="p-0 bg-transparent border-none cursor-pointer flex items-center"
      >
        {collapsed ? (
          <IconChevronRight size={16} className="text-gray-500" />
        ) : (
          <IconChevronDown size={16} className="text-gray-500" />
        )}
      </button>
      <span className="flex-shrink-0 text-base leading-none">{statusIcons[status] || '🟠'}</span>
      <span className="flex-1 font-medium" onClick={handleStartEdit}>{title}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(content || '')
        }}
        className="p-0 bg-transparent border-none cursor-pointer flex items-center opacity-40 hover:opacity-100 transition-opacity"
        title="Copy prompt content"
      >
        <IconCopy size={14} className="text-gray-500" />
      </button>
      <Badge color={statusColors[status]} size="sm">
        {status}
      </Badge>
    </div>
  )

  const renderShow = () => (
    <div className={`rounded ${statusBgColors[status]}`}>
      {renderHeader()}
      {!collapsed && (
        <div className="px-2 pb-2 cursor-pointer hover:opacity-80 rounded transition-colors" onClick={handleStartEdit}>
          {content ? (
            <div className="m-0 p-2 bg-white/50 rounded text-sm font-mono whitespace-pre-wrap break-words">
              {content}
            </div>
          ) : (
            <p className="m-0 p-2 text-gray-400 text-sm italic">Click to add prompt content...</p>
          )}
        </div>
      )}
    </div>
  )

  const renderEdit = () => (
    <form onSubmit={handleSave} className={`flex flex-col gap-3 p-3 ${statusBgColors[editStatus]}`}>
      <div className="flex flex-row gap-2">
        <div className="flex-1">
          <TextInput
            placeholder="Prompt title"
            size="sm"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="w-32">
          <Select
            size="sm"
            data={statusOptions}
            value={editStatus}
            onChange={(value) => setEditStatus(value || 'draft')}
          />
        </div>
      </div>

      <Textarea
        placeholder="Enter your prompt content..."
        size="sm"
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        autosize
        minRows={5}
        maxRows={15}
        styles={{
          input: {
            fontFamily: 'monospace',
          },
        }}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={handleCancel}
          leftSection={<IconX size={14} />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="xs"
          leftSection={<IconCheck size={14} />}
        >
          Save
        </Button>
      </div>
    </form>
  )

  return (
    <NodeViewWrapper className="prompt-component">
      <div contentEditable={false} data-drag-handle>
        {editing ? renderEdit() : renderShow()}
      </div>
    </NodeViewWrapper>
  )
}
