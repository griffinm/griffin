import { useParams } from 'react-router-dom';
import { Center, Loader, Text } from '@mantine/core';
import { useNote, useUpdateNote } from '@/hooks/useNotes';
import { Editor } from '@/components/Editor';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Editor as TiptapEditor } from '@tiptap/core';

const SAVE_TIMEOUT = 250;

export function NoteView() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading, error } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Sync title value when note changes
  useEffect(() => {
    if (note?.title) {
      setTitleValue(note.title);
    }
  }, [note?.title]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Handle saving title
  const handleSaveTitle = useCallback(async () => {
    const trimmedValue = titleValue.trim();
    if (!trimmedValue || !note || trimmedValue === note.title || !noteId) {
      setIsEditingTitle(false);
      setTitleValue(note?.title || '');
      return;
    }

    try {
      setIsSaving(true);
      await updateNoteMutation.mutateAsync({
        id: noteId,
        note: {
          title: trimmedValue,
          content: note.content,
        },
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      setTitleValue(note.title);
    } finally {
      setIsSaving(false);
    }
  }, [titleValue, note, noteId, updateNoteMutation]);

  // Handle canceling title edit
  const handleCancelTitleEdit = useCallback(() => {
    setTitleValue(note?.title || '');
    setIsEditingTitle(false);
  }, [note?.title]);

  // Handle key press in title input
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelTitleEdit();
    }
  }, [handleSaveTitle, handleCancelTitleEdit]);

  // Handle scroll detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 30);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
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
      
      {/* Editable Title */}
      <div 
        style={{ 
          position: isScrolled ? 'sticky' : 'relative',
          top: isScrolled ? 0 : 'auto',
          background: 'white',
          zIndex: 100,
          padding: isScrolled ? '8px 20px' : '16px 20px 0',
          marginBottom: isScrolled ? 0 : '12px',
          borderBottom: isScrolled ? '1px solid #e0e0e0' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            style={{
              width: '100%',
              border: 'none',
              borderBottom: '2px solid #228be6',
              fontSize: isScrolled ? '16px' : '20px',
              fontWeight: '600',
              padding: '4px 0',
              outline: 'none',
              background: 'transparent',
              transition: 'font-size 0.2s ease',
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            style={{
              fontSize: isScrolled ? '16px' : '20px',
              fontWeight: '600',
              margin: 0,
              padding: '4px 0',
              cursor: 'text',
              transition: 'font-size 0.2s ease',
            }}
          >
            {note.title || 'Untitled'}
          </h1>
        )}
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Editor 
          value={note.content || ''} 
          onUpdate={debouncedUpdate}
          minHeight="calc(100vh - 200px)"
          maxHeight="none"
          noteId={noteId}
        />
      </div>
    </div>
  );
}

