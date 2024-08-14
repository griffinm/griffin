import { Notebook } from "@prisma/client";
import { 
  MoreVert,
  Check,
} from '@mui/icons-material';
import { useState } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { 
  Button,
  ListItemButton,
  Input,
} from "@mui/material";
import { useNotes } from "../../providers/NoteProvider";
import classnames from "classnames";

interface ListItemProps {
  notebook: Notebook,
  open: boolean,
  onDeleteNotebook: (notebook: Notebook) => void;
}

export function ListItem({
  notebook,
  open,
  onDeleteNotebook,
}: ListItemProps) {
  const { 
    updateNotebook,
    currentNotebook,
  } = useNotes();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState(notebook.title || "");
  
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
            onDeleteNotebook(notebook);
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

  return (
    <div className="flex justify-between w-full">
      {renderTitle()}
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
  );
}

export interface ListProps {
  onDeleteNotebook: (notebook: Notebook) => void;
}

export function List({ onDeleteNotebook }: ListProps) {
  const { notebooks, setCurrentNotebook, currentNotebook } = useNotes();

  

  return (
    <>
      {notebooks.map((notebook) => (
        <ListItemButton key={notebook.id} onClick={() => setCurrentNotebook(notebook)}>
          <ListItem notebook={notebook} open={true} onDeleteNotebook={onDeleteNotebook} />
        </ListItemButton>
      ))}
    </>
  )
}
