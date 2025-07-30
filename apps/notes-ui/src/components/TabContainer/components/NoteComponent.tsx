import { useEffect } from "react";
import { Note } from "@prisma/client";
import { ComponentContainer } from "golden-layout";

interface NoteComponentProps {
  container: ComponentContainer;
  note: Note | undefined;
}

export function NoteComponent({ container, note }: NoteComponentProps) {
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

  return (
    <div className="h-full w-full p-6 overflow-auto bg-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {note.title || 'Untitled Note'}
        </h1>
        <div 
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ 
            __html: note.content || '<p class="text-gray-500 italic">This note is empty.</p>' 
          }}
        />
      </div>
    </div>
  );
}