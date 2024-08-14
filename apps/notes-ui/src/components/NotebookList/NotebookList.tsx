import { Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { List as NotebookListComponent } from "./List";
import { 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useNotes } from "../../providers/NoteProvider";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { ExpandMore, ExpandLess, Add } from '@mui/icons-material';

export function NotebookList() {
  const [deleteNotebookDialogOpen, setDeleteNotebookDialogOpen] = useState(false);
  const [notebookForDelete, setNotebookForDelete] = useState<Notebook | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const { 
    createNotebook,
    deleteNotebook, 
    fetchNotebooks,
    currentNotebook,
  } = useNotes();

  useEffect(() => {
    fetchNotebooks()
  }, []);

  const showDeleteNotebookDialog = (notebook: Notebook) => {
    setNotebookForDelete(notebook);
    setDeleteNotebookDialogOpen(true);
  }

  return (
    <div>
      <List
        sx={{ width: '100%' }}
        component="nav"
      >
        <ListItemButton onClick={() => setExpanded(!expanded)}>
          <ListItemIcon>
            <TextSnippetIcon />
          </ListItemIcon>
          <ListItemText primary="Notebooks"  />
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expanded} unmountOnExit timeout="auto">
          <ListItemButton>
            <ListItemIcon>
              <Add />
            </ListItemIcon>
            <ListItemText primary="New Notebook" onClick={() => createNotebook()} />
          </ListItemButton>
          <NotebookListComponent onDeleteNotebook={showDeleteNotebookDialog} />
        </Collapse>

        {notebookForDelete && (
          <ConfirmDialog<{ notebook: Notebook }>
            title="Delete Notebook"
            message={`Are you sure you want to delete "${notebookForDelete.title}"?`}
            data={{ notebook: notebookForDelete }}
            open={deleteNotebookDialogOpen}
            onClose={() => setDeleteNotebookDialogOpen(false)}
            onConfirm={({ notebook }) => deleteNotebook(notebook.id)}
          />
        )}
      </List>
    </div>
  );
}
