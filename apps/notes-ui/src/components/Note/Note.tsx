import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState, lazy } from "react";
import { Button, CircularProgress, Input } from "@mui/material";
// import { Editor } from './Editor'
const Editor = lazy(() => import('./Editor').then(module => ({ default: module.Editor })));
import { useNotes } from "../../providers/NoteProvider";
import { ContactSupport, Delete, OpenInNew } from '@mui/icons-material';
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
  const [newNoteTitle, setNewNoteTitle] = useState(currentNote?.title);
  const [searchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fs') === 'true';

  useEffect(() => {
    if (!noteId) return;
    setCurrentNoteId(noteId);
  }, [noteId, setCurrentNoteId]);

  useEffect(() => {
    setNewNoteTitle(currentNote?.title);
  }, [currentNote]);

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
    "pr-5 pt-5 pl-4 flex flex-col grow h-[100%]",
    {
      "h-[100vh]": isFullScreen,
      "max-w-[1000px]": !isFullScreen,
    },
  );

  return (
    <div className={containerClasses}>
      <div className="flex">
        <Input
          sx={{ fontSize: 24 }}
          fullWidth
          type="text"
          value={newNoteTitle || currentNote.title}
          onChange={(e) => {
            setNewNoteTitle(e.target.value);
          }}
          onBlur={(e) => {
            updateNote({ id: currentNote.id, title: e.target.value });
          }}
        />
        <div className="p-2">
          <Button
            variant="outlined"
            size="small"
          >
          <a 
            href={"#"} 
            className="flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(`/notes/${currentNote.id}?fs=true`, `${currentNote.title}`, 'width=1000,height=800');
            }}
          >
            <OpenInNew />
          </a>
          </Button>
        </div>
        <div className="p-2">
          <Button
            variant="outlined"
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
            size="small"
          >
              <Delete />
          </Button>
        </div>
      </div>
      <div className="mt-5 flex flex-row grow max-h-[calc(100vh-150px)]">
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
