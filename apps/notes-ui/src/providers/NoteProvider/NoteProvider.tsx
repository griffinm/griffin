import { Note, Notebook } from "@prisma/client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  createNote as createNoteApi, 
  createNotebook as createNotebookApi, 
  deleteNote as deleteNoteApi, 
  deleteNotebook as deleteNotebookApi,
  fetchNote as fetchNoteApi,
  fetchNotebooks as fetchNotebooksApi, 
  fetchNotesForNotebook as fetchNotesForNotebookApi,
  updateNote as updateNoteApi, 
  updateNotebook as updateNotebookApi, 
} from "../../utils/api";
import { useNavigate } from "react-router";
import { urls } from "../../utils/urls";

interface Props {
  children: React.ReactNode;
}

interface CurrentNoteProps {
  createNote: (notebookId: number) => void;
  createNotebook: () => void;
  currentNote: Note | null;
  deleteNote: (noteId: number) => void;
  deleteNotebook: (notebookId: number) => void;
  fetchNotebooks: () => void;
  fetchNotesForNotebook: (notebookId: number) => void;
  isSaving: boolean,
  notebooks: Notebook[];
  notebooksLoading: boolean;
  noteLoading: boolean;
  notes: Note[];
  notesLoading: boolean;
  setCurrentNoteId: (noteId: number) => void;
  updateNote: (note: Note) => void;
  updateNotebook: (notebook: Notebook) => void;
}

export const CurrentNoteContext = createContext<CurrentNoteProps>({
  createNote: () => {},
  createNotebook: () => {},
  currentNote: null,
  deleteNote: () => {},
  deleteNotebook: () => {},
  fetchNotebooks: () => {},
  fetchNotesForNotebook: () => {},
  isSaving: false,
  notebooks: [],
  notebooksLoading: false,
  noteLoading: false,
  notes: [],
  notesLoading: false,
  setCurrentNoteId: () => {},
  updateNote: () => {},
  updateNotebook: () => {},
});

export function NoteProvider({ children }: Props) {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notebooksLoading, setNotebooksLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const navigate = useNavigate();

  // Load the note once the current note ID is set
  useEffect(() => {
    setNoteLoading(true);
    if (currentNoteId) {
      fetchNoteApi(currentNoteId)
        .then((resp) => setCurrentNote(resp.data))
        .finally(() => setNoteLoading(false));
    }
  }, [currentNoteId]);

  // Load the notebooks once the component mounts
  useEffect(() => {
    setNotebooksLoading(true);
    fetchNotebooksApi().then((resp) => {
      setNotebooks(resp.data)
      setNotebooksLoading(false);
    })
  }, []);

  const fetchNotebooks = () => {
    setNotebooksLoading(true);
    fetchNotebooksApi().then((resp) => {
      setNotebooks(resp.data)
      setNotebooksLoading(false);
    })
  }

  const createNotebook = () => {
    setNotebooksLoading(true);
    createNotebookApi("New Notebook")
      .then((resp) => {setNotebooks([...notebooks, resp.data])})
      .finally(() => {setNotebooksLoading(false)})
  }

  const createNote = (notebookId: number) => {
    setNoteLoading(true);
    createNoteApi(notebookId)
      .then((resp) => {
        setCurrentNote(resp.data);
        navigate(urls.note(resp.data.id));
      })
      .finally(() => {setNoteLoading(false)})
  }

  const deleteNote = (noteId: number) => {
    setNoteLoading(true);
    deleteNoteApi(noteId)
      .then(() => {
        setNotes(notes.filter((note) => note.id !== noteId));
        setCurrentNote(null);
        navigate(urls.home);
      })
      .finally(() => {setNoteLoading(false)})
  }

  const deleteNotebook = (notebookId: number) => {
    setNotebooksLoading(true);
    deleteNotebookApi(notebookId)
      .then(() => {
        setNotebooks(notebooks.filter((notebook) => notebook.id !== notebookId));
      })
      .finally(() => {setNotebooksLoading(false)})
  }

  const updateNote = (note: Note) => {
    setIsSaving(true);
    updateNoteApi(note)
      .then(() => {
        setNotes(notes.map((n) => n.id === note.id ? note : n));
      })
      .finally(() => {setIsSaving(false)})
  }

  const fetchNotesForNotebook = (notebookId: number) => {
    setNotesLoading(true);
    fetchNotesForNotebookApi(notebookId)
      .then((resp) => {
        const newNotes = resp.data
        // remove all of these notes that belong to this notebook
        const notesWithOutNew = notes.filter((note) => note.notebookId !== notebookId);
        setNotes([...notesWithOutNew, ...newNotes]);
      })
      .finally(() => setNotesLoading(false));
  }

  const updateNotebook = (notebook: Notebook) => {
    updateNotebookApi(notebook.id, notebook)
      .then(() => setNotebooks(notebooks.map((n) => n.id === notebook.id ? notebook : n)))
  }

  return (
    <CurrentNoteContext.Provider
      value={{ 
        createNote,
        createNotebook,
        currentNote,
        deleteNote,
        deleteNotebook,
        fetchNotebooks,
        fetchNotesForNotebook,
        isSaving, 
        notebooks,
        notebooksLoading,
        noteLoading,
        notes,
        notesLoading,
        setCurrentNoteId,
        updateNote,
        updateNotebook,
      }}
    >
      {children}
    </CurrentNoteContext.Provider>
  );
}

export const useNotes = () => {
  return useContext(CurrentNoteContext);
}
