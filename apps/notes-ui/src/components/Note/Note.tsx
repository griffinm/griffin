import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState, lazy } from "react";
import { Button, CircularProgress, Input } from "@mui/material";
// import { Editor } from './Editor'
const Editor = lazy(() => import('./Editor').then(module => ({ default: module.Editor })));
import { useNotes } from "../../providers/NoteProvider";
import { Delete, OpenInNew } from '@mui/icons-material';
import { ConfirmDialog } from "../ConfirmDialog";
import { Note as NoteType } from "@prisma/client"
import { useNavigate } from "react-router-dom";
import classNames from "classnames";

export function Note() {
  const { noteId } = useParams();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { 
    currentNote,
    updateNote,
    deleteNote,
    noteLoading,
    setCurrentNoteId,
  } = useNotes();
  const [searchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fs') === 'true';

  useEffect(() => {
    if (!noteId) return;
    setCurrentNoteId(noteId);
  }, [noteId, setCurrentNoteId]);

  if (noteLoading || !currentNote) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />;
      </div>
    )
  }

  const handleDeleteNote = (note: NoteType) => {
    deleteNote(note.id);
    setOpenDeleteDialog(false);
    navigate("/");
  }

  const containerClasses = classNames(
    "flex flex-col grow h-[100%]"
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-row grow">
        <div className="grow">
          <Editor
            note={currentNote}
            onChange={(content) => updateNote({ id: currentNote.id, content })}
            isSaving={false}
          />
        </div>
      </div>
      <ConfirmDialog<NoteType>
        open={openDeleteDialog}
        onConfirm={(n) => handleDeleteNote(n)}
        onClose={() => setOpenDeleteDialog(false)}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        data={currentNote}
      />
    </div>
  );
}
