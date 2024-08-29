/* eslint-disable @typescript-eslint/no-empty-function */
import { Note, Notebook } from "@prisma/client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
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
import { useUser } from "../UserProvider";
import { AxiosResponse } from "axios";

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
  sortedNotes: Note[];
  allNotebooks: Notebook[];
  defaultNotebook: Notebook | undefined;
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
  sortedNotes: [],
  allNotebooks: [],
  defaultNotebook: undefined,
});

export function NoteProvider({ children }: Props) {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null | undefined>(undefined);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notebooksLoading, setNotebooksLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const navigate = useNavigate();
  const { user } = useUser();

  const sortedNotes = useMemo(() => {
    const newArray = [...notes]

    return newArray.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  const defaultNotebook = useMemo<Notebook | undefined>(() => {
    return notebooks.find((notebook) => notebook.isDefault);
  }, [notebooks]);

  const sortedNotebooks = useMemo<Notebook[]>(() => {
    if (notebooks.length === 0) return [];

    // The default notebook should always be at the top
    const defaultNotebook: Notebook | undefined = notebooks.find((notebook) => notebook.isDefault);
    const notebookArray: Notebook[] = notebooks.filter((notebook) => !notebook.isDefault)
    if (defaultNotebook) {
      notebookArray.unshift(defaultNotebook);
    }

    // Add all of the children to the top level notebooks
    const topLevelNotebooks = notebookArray.filter((notebook) => !notebook.parentId);
    topLevelNotebooks.forEach((notebook) => {
      notebook.children = notebooks.filter((n) => n.parentId === notebook.id);
    });

    return topLevelNotebooks;
  }, [notebooks]);

  // Load the note once the current note ID is set
  useEffect(() => {
    setNoteLoading(true);
    if (currentNoteId) {
      fetchNoteApi(currentNoteId)
        .then((resp) => {
          setCurrentNote(resp.data);

          if (currentNotebook?.id !== resp.data.notebookId) {
            // also set the current notebook to the note's notebook
            fetchNotebook(resp.data.notebookId)
          }
        })
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
    if (!user) return;

    setNotebooksLoading(true);
    fetchNotebooksApi().then((resp) => {
      const notebooks = resp.data;
      setNotebooks(notebooks)
      setNotebooksLoading(false);
    })
  }, [user]);

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
      .then((resp) => {
        setNotebooks([...notebooks, resp.data])
        setCurrentNotebook(resp.data)
      })
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

  const updateNote = async (
    note: NoteUpdateProps
  ): Promise<AxiosResponse<Note>> => {
    const updatedNote = notes.find((n) => n.id === note.id);
    
    // Perform an optimistic update to the notes array so that the UI updates immediately
    if (updatedNote) {
      const newArray = [...notes]
      const newNote = { ...note, ...updatedNote, updatedAt: new Date() };
      const newNoteArray = newArray.map(n => n.id === newNote.id ? newNote : n);
      setNotes([...newNoteArray]);

      if (currentNote && currentNote.id === note.id) {
        setCurrentNote(newNote);
      }
    }

    // Now actually perform an update
    return updateNoteApi(note)
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
        notebooks: sortedNotebooks,
        allNotebooks: notebooks,
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
        sortedNotes,
        defaultNotebook,
      }}
    >
      {children}
    </CurrentNoteContext.Provider>
  );
}

export const useNotes = () => {
  return useContext(CurrentNoteContext);
}
