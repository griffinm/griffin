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
import { TagManager } from '@/components/TagManager/TagManager';
import { Tag } from '@/types/tag';
import { addTagToNote, removeTagFromNote } from '@/api/notesApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTabsContext } from '@/providers/TabsProvider';

const SAVE_TIMEOUT = 500;

export function NoteView() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateTabTitle, closeTab } = useTabsContext();
  const { data: note, isLoading, error } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
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
    
    updateNoteMutation.mutate(
      { id: noteId, note: { title: note.title, content } }
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

  // Sync tab title when note title changes
  useEffect(() => {
    if (noteId && note?.title) {
      updateTabTitle(noteId, note.title);
    }
  }, [noteId, note?.title, updateTabTitle]);

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
      // Close the tab and navigate to the notebook
      closeTab(noteId);
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

  // Handle tag changes
  const handleTagsChange = async (newTags: Tag[]) => {
    if (!noteId || !note) return;

    const originalTags = note.tags || [];
    
    // Find removed tags
    const removedTags = originalTags.filter(
      (tag) => !newTags.some((newTag) => newTag.id === tag.id)
    );
    
    // Find added tags
    const addedTags = newTags.filter(
      (tag) => !originalTags.some((origTag) => origTag.id === tag.id)
    );
    
    try {
      // Remove tags
      for (const tag of removedTags) {
        await removeTagFromNote(noteId, tag.id);
      }
      
      // Add tags
      for (const tag of addedTags) {
        await addTagToNote(noteId, tag.name);
      }
      
      // Invalidate queries to refetch note with updated tags
      await queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error) {
      console.error('Error updating tags:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update tags',
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
      {/* Editable Title */}
      <div 
        style={{ 
          position: isScrolled ? 'sticky' : 'relative',
          top: isScrolled ? 0 : 'auto',
          background: 'white',
          zIndex: 50,
          padding: isScrolled ? '8px 20px' : '16px 20px 0',
          marginBottom: isScrolled ? 0 : '12px',
          borderBottom: isScrolled ? '1px solid #e0e0e0' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Title row with tags and menu */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
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
                minWidth: '200px',
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
                minWidth: '200px',
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
          
          {/* Tags Section - between title and menu on desktop, below title on mobile */}
          <div style={{ 
            flexShrink: 0,
            maxWidth: '400px',
            minWidth: '200px',
          }}>
            <TagManager 
              tags={note.tags || []} 
              onChange={handleTagsChange}
              placeholder="Add tags..."
            />
          </div>

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
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Editor
          key={noteId}
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

