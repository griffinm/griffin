import { useNotes } from '../../providers/NoteProvider'
import { Add } from "@mui/icons-material"
import { Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import { urls } from "../../utils/urls";
import classnames from "classnames";
import ArrowBack from '@mui/icons-material/ArrowBack';

export function NoteList() {
  const { 
    notes,
    currentNotebook,
    createNote,
    currentNote,
    setCurrentNotebook,
  } = useNotes();
  const navigate = useNavigate();
  const containerClasses = "border-b border-slate-700 p-2"

  if (!currentNotebook) {
    return null;
  }
  return (
    <div>
      <div>
        <Button
          onClick={() => setCurrentNotebook()}
          variant="text"
          sx={{ color: "white" }}
          startIcon={<ArrowBack />}
        >
          Go Back
        </Button>
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