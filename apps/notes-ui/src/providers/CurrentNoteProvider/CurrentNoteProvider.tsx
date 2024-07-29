import { Note } from "@prisma/client";
import { createContext, useContext, useState } from "react";
import { fetchNote, updateNote } from "../../utils/api";

interface Props {
  children: React.ReactNode;
}

interface CurrentNoteProps {
  note: Note | null;
  setCurrentNote: (noteId: number) => void;
  isLoading: boolean,
  isSaving: boolean,
  saveNote: (note: Note) => void;
}

export const CurrentNoteContext = createContext<CurrentNoteProps>({
  note: null,
  setCurrentNote: () => {},
  isLoading: false,
  isSaving: false,
  saveNote: () => {},
});

export function CurrentNoteProvider({ children }: Props) {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setCurrentNote = (noteId: number) => {
    setNote(null)
    setIsLoading(true)
    fetchNote(noteId).then((resp) => {
      setNote(resp.data)
      setIsLoading(false)
    })
  }

  const saveNote = async (note: Note) => {
    setIsSaving(true);
    updateNote(note).then(() => {
      setIsSaving(false);
    });
    setNote(note)
  }

  return (
    <CurrentNoteContext.Provider
      value={{ 
        isLoading, 
        isSaving, 
        note, 
        saveNote,
        setCurrentNote,
      }}
    >
      {children}
    </CurrentNoteContext.Provider>
  );
}

export const useCurrentNote = () => {
  return useContext(CurrentNoteContext);
}
