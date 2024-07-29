import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CircularProgress, Input } from "@mui/material";
import { Editor } from './Editor'
import { useCurrentNote } from "../../providers/CurrentNoteProvider";

export function Note() {
  const { noteId } = useParams();
  const { 
    note,
    setCurrentNote,
    isLoading,
    isSaving,
    saveNote,
  } = useCurrentNote();
  const [newNoteTitle, setNewNoteTitle] = useState(note?.title);

  useEffect(() => {
    if (!noteId) return;
    setCurrentNote(noteId);
  }, [noteId]);

  if (isLoading || !note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />;
      </div>
    )
  }

  return (
    <div className="pr-5 pt-5">
      <Input
        sx={{ fontSize: 24 }}
        fullWidth
        type="text"
        value={newNoteTitle || note.title}
        onChange={(e) => {
          setNewNoteTitle(e.target.value);
          saveNote({ ...note, title: e.target.value });
        }}
      />
      <div className="mt-5">
        <Editor
          note={note}
          onChange={(content) => saveNote({ ...note, content })}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
