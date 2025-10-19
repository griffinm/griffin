import { useParams, useNavigate } from 'react-router-dom';
import { Center, Loader, Text, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconTrash, IconCopy, IconFolderSymlink } from '@tabler/icons-react';
import { useNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { Editor } from '@/components/Editor';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Editor as TiptapEditor } from '@tiptap/core';
import { ConfirmationModal } from '../NoteTree/ConfirmationModal';
import { MoveNoteModal } from './MoveNoteModal';
import { notifications } from '@mantine/notifications';

const SAVE_TIMEOUT = 250;

export function NoteView() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading, error } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [moveModalOpened, setMoveModalOpened] = useState(false);
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

  // Handle deleting the note
  const handleDelete = async () => {
    if (!noteId || !note) return;

    try {
      await deleteNoteMutation.mutateAsync({
        id: noteId,
        notebookId: note.notebookId,
      });
      setDeleteModalOpened(false);
      // Navigate to the notebook after deleting the note
      navigate(`/notebooks/${note.notebookId}`);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Handle moving the note to a new notebook
  const handleMoveNote = async (newNotebookId: string) => {
    if (!noteId || !note) return;

    try {
      await updateNoteMutation.mutateAsync({
        id: noteId,
        note: {
          title: note.title,
          content: note.content,
          notebookId: newNotebookId,
        },
      });
      
      notifications.show({
        title: 'Success',
        message: 'Note moved successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error moving note:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to move note',
        color: 'red',
      });
    }
  };

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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
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
              flex: 1,
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
              flex: 1,
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
        
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="lg">
              <IconDots size={20} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Note actions</Menu.Label>
            <Menu.Item 
              leftSection={<IconFolderSymlink size={16} />}
              onClick={() => setMoveModalOpened(true)}
            >
              Move to notebook
            </Menu.Item>
            <Menu.Item leftSection={<IconCopy size={16} />}>
              Duplicate note
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              color="red" 
              leftSection={<IconTrash size={16} />}
              onClick={() => setDeleteModalOpened(true)}
            >
              Delete note
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
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

      <MoveNoteModal
        opened={moveModalOpened}
        onClose={() => setMoveModalOpened(false)}
        onSelectNotebook={handleMoveNote}
        currentNotebookId={note.notebookId}
      />

      <ConfirmationModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${note.title || 'Untitled'}"?`}
        confirmLabel="Delete"
        isLoading={deleteNoteMutation.isPending}
      />
    </div>
  );
}

