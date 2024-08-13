import { Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { List } from "./List";
import { Button, Typography } from "@mui/material";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useNotes } from "../../providers/NoteProvider";

export function NotebookList() {
  const [deleteNotebookDialogOpen, setDeleteNotebookDialogOpen] = useState(false);
  const [notebookForDelete, setNotebookForDelete] = useState<Notebook | null>(null);
  const { 
    createNote,
    createNotebook, 
    deleteNotebook, 
    fetchNotebooks, 
    notebooks,
    updateNotebook, 
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
        <div className="p-2 flex items-center justify-between">
          <Typography variant='body1'>Notebooks</Typography>
          <Button
            size='small'
            variant='outlined'
            onClick={createNotebook}
          >
            New
          </Button>
        </div>
      </div>
      <div>
        <List
          notebooks={notebooks}
          onUpdateNotebook={updateNotebook}
          onDeleteNotebook={showDeleteNotebookDialog}
          onCreateNote={(notebook) => createNote(notebook.id)}
        />
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
