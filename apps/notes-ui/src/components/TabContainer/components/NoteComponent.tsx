import { useEffect } from "react";
import { Note as NoteType } from "@prisma/client";
import { ComponentContainer } from "golden-layout";
import { Note } from "../../Note/Note";

interface NoteComponentProps {
  container: ComponentContainer;
  note: NoteType | undefined;
  onUpdateNote?: (note: NoteType) => void;
  onDeleteNote?: (noteId: string) => void;
}

export function NoteComponent({ 
  container, 
  note, 
  onUpdateNote, 
  onDeleteNote 
}: NoteComponentProps) {
  useEffect(() => {
    if (note?.title) {
      container.setTitle(note.title);
    }
  }, [note?.title, container]);

  if (!note) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading note...</div>
        </div>
      </div>
    );
  }

  // Default handlers if not provided
  const handleUpdateNote = onUpdateNote || (() => {
    console.warn('Note update not handled in tab view');
  });

  const handleDeleteNote = onDeleteNote || (() => {
    console.warn('Note deletion not handled in tab view');
  });

  return (
    <div className="h-full w-full bg-white">
      <Note
        note={note}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  );
}