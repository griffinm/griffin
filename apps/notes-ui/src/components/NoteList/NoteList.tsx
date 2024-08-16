import { useNotes } from '../../providers/NoteProvider'
import { Add } from "@mui/icons-material"
import { Button, Typography } from "@mui/material"
import { Link, useNavigate } from "react-router-dom";
import { urls } from "../../utils/urls";
import classnames from "classnames";
import ArrowBack from '@mui/icons-material/ArrowBack';

export function NoteList() {
  const { 
    sortedNotes: notes,
    currentNotebook,
    createNote,
    currentNote,
    setCurrentNoteId,
    setCurrentNotebook,
  } = useNotes();
  const navigate = useNavigate();
  const containerClasses = "border-b border-slate-700 p-2"

  const handleGoBack = () => {
    setCurrentNoteId(null);
    setCurrentNotebook();
    navigate(urls.home);
  }

  if (!currentNotebook) {
    return null;
  }
  return (
    <div className="grow">
      
      <Button
        variant="text"
        startIcon={<ArrowBack />}
        sx={{ color: "white" }}
        onClick={handleGoBack}
      >
        Go Back
      </Button>

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
      {notes.map((note) => {
        const isCurrentNote = note.id === currentNote?.id;
        const classes = classnames(
          containerClasses,
          {
            "bg-dark-2": isCurrentNote,
            "cursor-pointer": true,
          }
        );
        return (
          <div 
            key={note.id}
            className={classes}
            onClick={() => navigate(urls.note(note.id))}
          >
            {note.title}
          </div>
        )
      })}
    </div>
  )
}