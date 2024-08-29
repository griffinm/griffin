import React from "react";
import { NotebookListItem } from "./NotebookListItem";
import { Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
} from "@mui/material";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useNotes } from "../../providers/NoteProvider";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { ExpandMore, ExpandLess, Add } from '@mui/icons-material';
import { findChildrenForParent } from "./utils";

export function NotebookList() {
  const [deleteNotebookDialogOpen, setDeleteNotebookDialogOpen] = useState(false);
  const [notebookForDelete, setNotebookForDelete] = useState<Notebook | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const { 
    createNotebook,
    deleteNotebook, 
    fetchNotebooks,
    notebooks,
    allNotebooks,
  } = useNotes();

  useEffect(() => {
    fetchNotebooks()
  }, []);

  const showDeleteNotebookDialog = (notebook: Notebook) => {
    setNotebookForDelete(notebook);
    setDeleteNotebookDialogOpen(true);
  }

  const renderNotebookList = () => {
    return notebooks.map((notebook) => {
      const children = findChildrenForParent(notebook, allNotebooks);
      return (
        <NotebookListItem
          key={notebook.id}
          notebook={notebook}
          showNotebookDeleteDialog={showDeleteNotebookDialog}
          allNotebooks={allNotebooks}
        />
      )
    })
  }

  return (
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
        <div className="text-center">
          <Button onClick={() => createNotebook()} variant="text" sx={{ color: '#FFF'}} startIcon={<Add />}>
            Create Notebook
          </Button>
        </div>
        <List component="div" disablePadding>
          {renderNotebookList()}
        </List>
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
  );
}
