import { Note, Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { 
  fetchNotebooks, 
  updateNotebook, 
  createNotebook, 
  deleteNotebook,
  createNote,
} from "../../utils/api";
import { List } from "./List";
import { Button, Typography } from "@mui/material";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";

export function NotebookList() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [deleteNotebookDialogOpen, setDeleteNotebookDialogOpen] = useState(false);
  const [notebookForDelete, setNotebookForDelete] = useState<Notebook | null>(null);
  const [newNote, setNewNote] = useState<Note | null>(null);

  useEffect(() => {
    fetchNotebooks().then((resp) => {
      setNotebooks(resp.data)
    })
  }, []);

  const onUpdateNotebook = (notebook: Notebook) => {
    updateNotebook(notebook.id, notebook)
      .then((resp) => {
        setNotebooks(notebooks.map((nb) => nb.id === notebook.id ? notebook : nb))
      })
  }

  const onCreateNotebook = () => {
    createNotebook("New Notebook")
      .then((resp) => {
        setNotebooks([resp.data, ...notebooks])
      })
  }

  const showDeleteNotebookDialog = (notebook: Notebook) => {
    setNotebookForDelete(notebook);
    setDeleteNotebookDialogOpen(true);
  }

  const onDeleteNotebook = (notebook: Notebook) => {
    deleteNotebook(notebook.id)
      .then((resp) => {
        setNotebooks(notebooks.filter((nb) => nb.id !== notebook.id))
        setNotebookForDelete(null);
      })
  }

  const onCreateNote = (notebook: Notebook) => {
    createNote(notebook.id)
      .then((resp) => {
        setNewNote(resp.data);
      })
  }

  return (
    <div>
      <div>
        <div className="p-2 flex items-center justify-between">
          <Typography variant='body1'>Notebooks</Typography>
          <Button
            size='small'
            variant='outlined'
            onClick={onCreateNotebook}
          >
            New
          </Button>
        </div>
      </div>
      <div>
        <List
          notebooks={notebooks}
          onUpdateNotebook={onUpdateNotebook}
          onDeleteNotebook={showDeleteNotebookDialog}
          onCreateNote={onCreateNote}
          newNote={newNote}
        />
      </div>
      {notebookForDelete && (
        <ConfirmDialog<{ notebook: Notebook }>
          title="Delete Notebook"
          message={`Are you sure you want to delete "${notebookForDelete.title}"?`}
          data={{ notebook: notebookForDelete }}
          open={deleteNotebookDialogOpen}
          onClose={() => setDeleteNotebookDialogOpen(false)}
          onConfirm={({ notebook }) => onDeleteNotebook(notebook)}
        />  
      )}
    </div>
  );
}
