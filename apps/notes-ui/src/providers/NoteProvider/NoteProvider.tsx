/* eslint-disable @typescript-eslint/no-empty-function */
import { Note, Notebook } from "@prisma/client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  NoteUpdateProps,
  createNote as createNoteApi, 
  createNotebook as createNotebookApi, 
  deleteNote as deleteNoteApi, 
  deleteNotebook as deleteNotebookApi,
  fetchNote as fetchNoteApi,
  fetchNotebooks as fetchNotebooksApi, 
  fetchNotesForNotebook as fetchNotesForNotebookApi,
  updateNote as updateNoteApi, 
  updateNotebook as updateNotebookApi, 
  fetchNotebook as fetchNotebookApi,
} from "../../utils/api";
import { useNavigate } from "react-router";
import { urls } from "../../utils/urls";

interface Props {
  children: React.ReactNode;
}

interface CurrentNoteProps {
  createNote: (notebookId: string) => void;
  createNotebook: () => void;
  currentNote: Note | null;
  deleteNote: (noteId: string) => void;
  deleteNotebook: (notebookId: string) => void;
  fetchNotebooks: () => void;
  fetchNotesForNotebook: (notebookId: string) => void;
  isSaving: boolean,
  notebooks: Notebook[];
  notebooksLoading: boolean;
  noteLoading: boolean;
  notes: Note[];
  notesLoading: boolean;
  setCurrentNoteId: (noteId: string) => void;
  updateNote: (note: NoteUpdateProps) => void;
  updateNotebook: (notebook: Notebook) => void;
  setCurrentNotebook: (notebook?: Notebook) => void;
  currentNotebook: Notebook | null;
  fetchNotebook: (notebookId: string) => void;
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
  setCurrentNotebook: () => {}, 
  currentNotebook: null,
  fetchNotebook: () => {},
});

export function NoteProvider({ children }: Props) {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notebooksLoading, setNotebooksLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
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

  // Load the notes once the current notebook is set
  useEffect(() => {
    if (currentNotebook) {
      setNotes([])
      fetchNotesForNotebook(currentNotebook.id)
    }
  }, [currentNotebook]);

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

  const createNote = (notebookId: string) => {
    setNoteLoading(true);
    createNoteApi(notebookId)
      .then((resp) => {
        setCurrentNote(resp.data);
        navigate(urls.note(resp.data.id));
        setNotes([resp.data, ...notes]);
      })
      .finally(() => {setNoteLoading(false)})
  }

  const deleteNote = (noteId: string) => {
    setNoteLoading(true);
    deleteNoteApi(noteId)
      .then(() => {
        setNotes(notes.filter((note) => note.id !== noteId));
        setCurrentNote(null);
        navigate(urls.home);
      })
      .finally(() => {setNoteLoading(false)})
  }

  const deleteNotebook = (notebookId: string) => {
    setNotebooksLoading(true);
    deleteNotebookApi(notebookId)
      .then(() => {
        setNotebooks(notebooks.filter((notebook) => notebook.id !== notebookId));
      })
      .finally(() => {setNotebooksLoading(false)})
  }

  const updateNote = (note: NoteUpdateProps) => {
    setIsSaving(true);
    updateNoteApi(note)
      .finally(() => {setIsSaving(false)})

    const updatedNote = notes.find((n) => n.id === note.id);
    const newNote = {...updatedNote, ...note};

    if (updatedNote) {
      setNotes(notes.map((n) => n.id === note.id ? newNote as Note : n));
    }
  }

  const fetchNotesForNotebook = (notebookId: string) => {
    setNotesLoading(true);
    fetchNotesForNotebookApi(notebookId)
      .then((resp) => {
        setNotes(resp.data);
      })
      .finally(() => setNotesLoading(false));
  }

  const updateNotebook = (notebook: Notebook) => {
    updateNotebookApi(notebook.id, notebook)
      .then(() => setNotebooks(notebooks.map((n) => n.id === notebook.id ? notebook : n)))
  }

  const fetchNotebook = (notebookId: string) => {
    setNotebooksLoading(true);
    fetchNotebookApi(notebookId)
      .then((resp) => {
        setCurrentNotebook(resp.data);
      })
      .finally(() => setNotebooksLoading(false));
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
        setCurrentNotebook,
        currentNotebook,
        fetchNotebook,
      }}
    >
      {children}
    </CurrentNoteContext.Provider>
  );
}

export const useNotes = () => {
  return useContext(CurrentNoteContext);
}
