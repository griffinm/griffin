import { Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { List } from "./List";
import { Button, Typography, Divider } from "@mui/material";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useNotes } from "../../providers/NoteProvider";
import { 
  KeyboardArrowRight,
  KeyboardArrowDown,
} from '@mui/icons-material';

export function NotebookList() {
  const [deleteNotebookDialogOpen, setDeleteNotebookDialogOpen] = useState(false);
  const [notebookForDelete, setNotebookForDelete] = useState<Notebook | null>(null);
  const [expanded, setExpanded] = useState<boolean>(true);

  const { 
    createNotebook, 
    deleteNotebook, 
    fetchNotebooks, 
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
      <div>
        <div className="p-2 flex items-center justify-between cursor-pointer">
          <Typography variant='h6' onClick={() => setExpanded(!expanded)}>
            {expanded ?
             <KeyboardArrowDown /> :
             <KeyboardArrowRight />
            }
            Notebooks
          </Typography>
          <Button
            size='small'
            variant='outlined'
            onClick={createNotebook}
          >
            New
          </Button>
        </div>
        <Divider />
      </div>
      <div>
        {expanded && <List onDeleteNotebook={showDeleteNotebookDialog} />} 
      </div>
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
    </div>
  );
}
