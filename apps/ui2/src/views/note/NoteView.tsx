import { useParams } from 'react-router-dom';
import { Center, Loader, Text } from '@mantine/core';
import { useNote, useUpdateNote } from '@/hooks/useNotes';
import { Editor } from '@/components/Editor';
import { useCallback, useRef, useState } from 'react';
import { Editor as TiptapEditor } from '@tiptap/core';

const SAVE_TIMEOUT = 250;

export function NoteView() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading, error } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const [isSaving, setIsSaving] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback((content: string) => {
    if (!noteId || !note) return;
    
    setIsSaving(true);
    updateNoteMutation.mutate(
      { id: noteId, note: { title: note.title, content } },
      {
        onSettled: () => {
          setIsSaving(false);
        },
      }
    );
  }, [noteId, note, updateNoteMutation]);

  const debouncedUpdate = useCallback(({ editor }: { editor: TiptapEditor }) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const html = editor.getHTML();
      handleSave(html);
    }, SAVE_TIMEOUT);
  }, [handleSave]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !note) {
    return (
      <Center h="100%">
        <Text c="red">Error loading note</Text>
      </Center>
    );
  }

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
    }}>
      {isSaving && (
        <div style={{ 
          position: 'fixed', 
          top: 60, 
          right: 30, 
          padding: '4px 8px', 
          background: '#f0f0f0', 
          borderRadius: 4,
          fontSize: 12,
          zIndex: 1000
        }}>
          Saving...
        </div>
      )}
      <Editor 
        value={note.content || ''} 
        onUpdate={debouncedUpdate}
        minHeight="calc(100vh - 200px)"
        maxHeight="calc(100vh - 200px)"
      />
    </div>
  );
}

