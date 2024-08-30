import { Notebook } from "@prisma/client";
import { 
  MoreVert,
  Check,
  Add,
  Edit,
  Delete,
  MoveDown,
} from '@mui/icons-material';
import { useState } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { 
  Button,
  Divider,
  Input,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useNotes } from "../../providers/NoteProvider";
import { MoveNotebook } from "./MoveNotebook";

interface NotebookTitleProps {
  notebook: Notebook,
  onDeleteNotebook: (notebook: Notebook) => void;
}

export function NotebookTitle({
  notebook,
  onDeleteNotebook,
}: NotebookTitleProps) {
  const { 
    updateNotebook,
    setCurrentNotebook,
  } = useNotes();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moveAnchorEl, setMoveAnchorEl] = useState<null | HTMLElement>(null);
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
        }}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>
            Edit Name
          </ListItemText>
        </MenuItem>

        {notebook.parentId && (
          <MenuItem 
            onClick={(e) => {
              setMoveAnchorEl(e.target as HTMLElement);
            }}
          >
            <ListItemIcon>
              <MoveDown />
            </ListItemIcon>
            <ListItemText>
              Move
            </ListItemText>
          </MenuItem>
        )}

        {!notebook.parentId && (
          <MenuItem 
            onClick={() => {
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <Add />
            </ListItemIcon>
            <ListItemText>
              Create Child Notebook
            </ListItemText>
          </MenuItem>
        )}

        <Divider />

        <MenuItem 
          onClick={() => {
            onDeleteNotebook(notebook);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>
            Delete
          </ListItemText>
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
    return <ListItemText primary={notebook.title || 'New Notebook'} />
  }

  return (
    <div className="flex justify-between w-full">
      <div className="grow" onClick={() => setCurrentNotebook(notebook)}>
        {renderTitle()}
      </div>
      <div>
        {!isEditing && !notebook.isDefault && (
          <MoreVert 
            fontSize="small" 
            onClick={(e) => setAnchorEl(e.target as HTMLElement)}
          />
        )}
        {renderMenu()}
        <MoveNotebook 
          notebook={notebook}
          anchorEl={moveAnchorEl}
          onClose={() => setMoveAnchorEl(null)}
        />
      </div>
    </div>
  );
}
