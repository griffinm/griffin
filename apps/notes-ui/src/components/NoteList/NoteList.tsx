import { useNotes } from '../../providers/NoteProvider'
import { Add } from "@mui/icons-material"
import { Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import { urls } from "../../utils/urls";
import classnames from "classnames";

export function NoteList() {
  const { 
    notes,
    currentNotebook,
    createNote,
    currentNote,
  } = useNotes();
  const navigate = useNavigate();
  const containerClasses = "border-b border-slate-700 p-2"

  if (!currentNotebook) {
    return null;
  }
  return (
    <div>
      <div className={`${containerClasses} text-center`}>
        <Button
          variant="text"
          startIcon={<Add />}
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
            "bg-gray-100": isCurrentNote,
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