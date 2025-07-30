import { useNotes } from '../../providers/NoteProvider'
import { Add } from "@mui/icons-material"
import { Button, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom";
import { urls } from "../../utils/urls";
import { Close } from '@mui/icons-material';
import { NoteListItem } from './NoteListItem';
import { useState, useEffect } from 'react'
import { Note } from '@prisma/client';

export function NoteList() {
  const { 
    sortedNotes: notes,
    currentNotebook,
    createNote,
    setCurrentNoteId,
    setCurrentNotebook,
  } = useNotes();
  const navigate = useNavigate();
  const containerClasses = "border-b border-slate-700 p-2"
  const [movedNotes, setMNovedNotes] = useState<string[]>([]);

  useEffect(() => {
    setMNovedNotes([]);
  }, [currentNotebook]);

  const filteredNotes = (): Note[] => {
    if (!notes || notes.length === 0) {
      return [];
    }

    if (movedNotes.length) {
      return notes.filter((note) => !movedNotes.includes(note.id));
    }
    return notes;
  }

  const handleMoveNote = (note: Note):void => {
    setMNovedNotes([...movedNotes, note.id]);
  }

  const handleGoBack = () => {
    setCurrentNoteId();
    setCurrentNotebook();
    navigate(urls.home);
  }

  if (!currentNotebook) {
    return null;
  }
  return (
    <div className="grow">
      <div className="p-2 text-center border-b border-slate-700">
        <Button
          variant="text"
          startIcon={<Close />}
          sx={{ color: "white" }}
          onClick={handleGoBack}
        >
          Close Notebook
        </Button>
      </div>

      <div className="p-2 text-center">
        <Typography variant="h6">
          {currentNotebook.title}
        </Typography>
      </div>
      <div className={`${containerClasses} text-center`}>
        <Button
          variant="text"
          startIcon={<Add />}
          sx={{ color: "white" }}
          onClick={() => createNote(currentNotebook?.id)}
        >
          New Note
        </Button>
      </div>
      {filteredNotes().map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          onMoveNote={handleMoveNote}
        />
      ))}
    </div>
  )
}
