import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Center, Loader, Text } from '@mantine/core';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useCreateNote } from '@/hooks/useNotes';
import { notifications } from '@mantine/notifications';

export function CreateNotePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: notebooks, isLoading: isLoadingNotebooks, error: notebooksError } = useNotebooks();
  const createNoteMutation = useCreateNote();

  useEffect(() => {
    if (isLoadingNotebooks || !notebooks) {
      return;
    }

    // Get the notebook parameter, defaulting to "default"
    const notebookParam = searchParams.get('notebook') || 'default';
    
    // Find the appropriate notebook
    let targetNotebook;
    if (notebookParam === 'default') {
      targetNotebook = notebooks.find(notebook => notebook.isDefault);
    } else {
      // If a specific notebook ID is provided, find that notebook
      targetNotebook = notebooks.find(notebook => notebook.id === notebookParam);
    }

    if (!targetNotebook) {
      notifications.show({
        title: 'Error',
        message: notebookParam === 'default' 
          ? 'No default notebook found. Please create a notebook first.'
          : 'Notebook not found.',
        color: 'red',
      });
      // Redirect to notebooks page if no notebook found
      navigate('/notebooks', { replace: true });
      return;
    }

    // Create the note
    const createNote = async () => {
      try {
        const newNote = await createNoteMutation.mutateAsync({
          notebookId: targetNotebook.id,
          note: {
            title: 'New Note',
            content: '',
          },
        });

        // Navigate to the newly created note
        navigate(`/notes/${newNote.id}`, { replace: true });
      } catch (error) {
        console.error('Error creating note:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to create note',
          color: 'red',
        });
        // Redirect to the notebook page on error
        navigate(`/notebooks/${targetNotebook.id}`, { replace: true });
      }
    };

    createNote();
  }, [notebooks, isLoadingNotebooks, searchParams, createNoteMutation, navigate]);

  if (notebooksError) {
    return (
      <Center h="100vh">
        <Text c="red">Error loading notebooks</Text>
      </Center>
    );
  }

  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}

