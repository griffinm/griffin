import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { useNotes } from "../../../../providers/NoteProvider";
import { Input, Typography } from "@mui/material";

export function Component(props: any) {
  const { currentNote, updateNote } = useNotes();
  const [editing, setEditing] = useState(currentNote?.title === '');
  const [title, setTitle] = useState(currentNote?.title || 'New Note');

  const handleSave = () => {
    setEditing(false)
    if (currentNote) {
      updateNote({
        ...currentNote,
        title,
      })
    }
  }

  const renderEdit = () => {
    return (
      <div className="flex w-full">
        <Input
          autoFocus
          fullWidth
          sx={{
            fontSize: 28,
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            }
          }}
        />
      </div>
    )
  }

  const renderShow = () => {
    return (
      <div
        className="cursor-pointer border-b border-slate-700 w-full hover:bg-dark-1 py-2 mb-2 transition-colors"
        onClick={() => setEditing(true)}
      >
        <Typography variant="h2">{title}</Typography>
      </div>
    )
  }

  return (
    <NodeViewWrapper className="gc-title-bar">
      <div className="flex py-1">
        {editing ? renderEdit() : renderShow()}
      </div>
    </NodeViewWrapper>
  )
}
