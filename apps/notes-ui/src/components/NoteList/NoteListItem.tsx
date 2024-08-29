import { Note } from "@prisma/client";
import { useNotes } from "../../providers/NoteProvider";
import { useNavigate } from "react-router-dom";
import classnames from "classnames";
import { urls } from "../../utils/urls";
import { MoreVert } from '@mui/icons-material';
import { useState, useMemo } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Input, Typography } from "@mui/material";

interface Props {
  note: Note;
  onMoveNote: (note: Note) => void;
}

export function NoteListItem({
  note,
  onMoveNote,
}: Props) {
  const { currentNote, allNotebooks, updateNote, fetchNotesForNotebook } = useNotes();
  const navigate = useNavigate();
  const isCurrentNote = note.id === currentNote?.id;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterTerm, setFilterTerm] = useState('');
  
  const filteredNotebooks = useMemo(() => {
    if (filterTerm) {
      return allNotebooks.filter((notebook) => notebook.title?.toLowerCase().includes(filterTerm.toLowerCase()));
    }
    return allNotebooks;
  }, [allNotebooks, filterTerm]);

  const classes = classnames(
    "border-b border-slate-700 p-2 flex justify-between",
    {
      "bg-dark-2": isCurrentNote,
      "cursor-pointer": true,
    }
  );

  return (
    <div
      className={classes}
      onClick={() => navigate(urls.note(note.id))}
    >
      <div>
        {note.title}
      </div>
      <div>
        <MoreVert 
          onClick={(e) => setAnchorEl(e.target as HTMLElement)}
        />
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <div className="p-2">
          <Typography variant="h6">Move Note</Typography>
          <Input 
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            placeholder="Filter"
          />
          <div className="max-h-[200px] overflow-y-auto mt-2">
            {filteredNotebooks.map((notebook) => (
              <MenuItem
                key={notebook.id}
                onClick={() => {
                  setAnchorEl(null);
                  setFilterTerm('');
                  updateNote({
                    ...note,
                    notebookId: notebook.id,
                  })
                  onMoveNote(note);
                }}
              >
                {notebook.title}
              </MenuItem>
            ))}
          </div>
        </div>
      </Menu>
    </div>
  )
}
