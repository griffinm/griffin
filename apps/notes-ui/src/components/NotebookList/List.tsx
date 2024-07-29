import { Note, Notebook } from "@prisma/client";
import { 
  KeyboardArrowRight,
  KeyboardArrowDown,
  MoreVert,
  Check,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Button, Input, Typography } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useNotes } from "../../providers/NoteProvider";
import classnames from "classnames";
import { urls } from "../../utils/urls";

interface ListItemProps {
  notebook: Notebook,
  open: boolean,
}

export function ListItem({
  notebook,
  open,
}: ListItemProps) {
  const { 
    notes, 
    fetchNotesForNotebook,
    currentNote,
    updateNotebook,
    deleteNotebook,
    createNote,
  } = useNotes();
  const [isOpen, setIsOpen] = useState(open);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState(notebook.title || "");
  const notesForNotebook = useMemo(() => {
    return notes.filter((note) => note.notebookId === notebook.id);
  }, [notes, notebook]);
  const orderedNotes = useMemo(() => {
    return notesForNotebook.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notesForNotebook]);

  useEffect(() => {
    if (isOpen) {
      fetchNotesForNotebook(notebook.id)
    }
  }, [isOpen, notebook]);


  const renderMenu = () => {
    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setIsEditing(false);
        }}
      >
        <MenuItem onClick={() => {
          setIsEditing(true);
          setAnchorEl(null);
        }}>Edit Name</MenuItem>

        <MenuItem 
          onClick={() => {
            deleteNotebook(notebook.id)
            setAnchorEl(null);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    )
  }

  const renderTitle = () => {
    if (isEditing) {
      return (
        <div className="flex items-center w-full">
          <Input 
            type="text" 
            value={newNotebookTitle}
            placeholder="Notebook Title"
            onChange={(e) => setNewNotebookTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                setAnchorEl(null);
                updateNotebook({
                  ...notebook,
                  title: newNotebookTitle,
                });
              }
            }}
            autoFocus
          />
          <Button
            variant="text"
            color="primary"
            size="small"
            onClick={() => {
              setIsEditing(false);
              setAnchorEl(null);
              updateNotebook({
                ...notebook,
                title: newNotebookTitle,
              });
            }}
          >
            <Check />
          </Button>
        </div>
      )
    }
    return <div>{notebook.title || 'New Notebook'}</div>
  }

  const renderNoteListItem = (note: Note) => {
    const isCurrentNote = note.id === currentNote?.id;
    const containerClasses = classnames(
      "text-sm p-1 mb-1 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out",
      {
        "bg-gray-100": isCurrentNote,
      }
    );

    return (
      <Link to={urls.note(note.id)} key={note.id}>
        <div className={containerClasses}>
        <Typography variant="h6">
          {note.title}
        </Typography>
        <Typography variant="caption">
          Edited: {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </Typography>
        </div>
      </Link>
    )
  }

  const renderNotes = () => {
    return (
      <>
        {isOpen && !isEditing && (
          <div className="p-1 mb-3">
            {orderedNotes.map((note) => (
              renderNoteListItem(note)
            ))}
            {isOpen && notes.length === 0 && (
              <div className="text-gray-500 italic">No notes</div>
            )}
          </div>
        )}
      </>
    )
  }

  const renderNew = () => {
    if (!isOpen && !isEditing) {
      return null;
    }

    return (
      <div>
        <Button 
          variant="text"
          size="small"
          color="primary"
          onClick={() => createNote()}
        >
          Create a new note
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div 
        className="flex py-1 cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out"
      >
        {!isEditing && (
          isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />
        )}
        <div className="flex justify-between w-full">
          <div 
            className="flex items-center w-full"
            onClick={() => !isEditing && setIsOpen(!isOpen)}
            >
            {renderTitle()}
          </div>
          <div>
            {!isEditing && (
              <MoreVert 
                fontSize="small" 
                onClick={(e) => setAnchorEl(e.target as HTMLElement)}
              />
            )}
            {renderMenu()}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        {renderNew()}
      </div>
      {renderNotes()}

    </div>
  );
}

export function List() {
  const { currentNote, notebooks } = useNotes();
  return (
    <div className="p-2">
      {notebooks.map((notebook) => {
        const containsCurrentNote = notebook.id === currentNote?.notebookId;
        return (
          <ListItem
            key={notebook.id}
            notebook={notebook}
            open={containsCurrentNote}
          />
        )
      })}
    </div>
  );
}
