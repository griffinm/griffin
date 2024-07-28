import { Note, Notebook } from "@prisma/client";
import { 
  KeyboardArrowRight,
  KeyboardArrowDown,
  MoreVert,
  Check,
} from '@mui/icons-material';
import { useEffect, useState } from "react";
import { fetchNotesForNotebook } from "../../utils/api";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Button, Input } from "@mui/material";

interface NotebooksProps {
  notebooks: Notebook[],
  onUpdateNotebook: (notebook: Notebook) => void,
}

interface ListItemProps {
  notebook: Notebook,
  onUpdateNotebook: (notebook: Notebook) => void,
}

export function ListItem({
  notebook,
  onUpdateNotebook,
}: ListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState(notebook.title || "");

  useEffect(() => {
    if (isOpen) {
      fetchNotesForNotebook(notebook.id)
        .then((res) => setNotes(res.data))
        .catch((err) => console.error(err));
    } else {
      setNotes([]);
    }
  }, [isOpen]);

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
        <MenuItem>Delete</MenuItem>
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
                onUpdateNotebook({
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
              onUpdateNotebook({
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

  const renderNotes = () => {
    return (
      <>
        {isOpen && !isEditing && (
          <div className="pl-6 mb-3">
            {notes.map((note) => (
              <div key={note.id}>{note.title}</div>
            ))}
            {isOpen && notes.length === 0 && (
              <div className="text-gray-500 italic">No notes</div>
            )}
          </div>
        )}
      </>
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
      
      {renderNotes()}
    </div>
  );
}

export function List({
  notebooks,
  onUpdateNotebook,
}: NotebooksProps) {
  return (
    <div className="p-2">
      {notebooks.map((notebook) => (
        <ListItem
          key={notebook.id}
          notebook={notebook}
          onUpdateNotebook={onUpdateNotebook}
        />
      ))}
    </div>
  );
}
