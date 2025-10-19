import { Button, Group, Paper } from '@mantine/core';
import { IconPlus, IconNote } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useCreateNote } from '@/hooks/useNotes';
import { notifications } from '@mantine/notifications';

interface ActionBarProps {
  onCreateTask: () => void;
}

export function ActionBar({ onCreateTask }: ActionBarProps) {
  const navigate = useNavigate();
  const { data: notebooks } = useNotebooks();
  const createNoteMutation = useCreateNote();

  const handleCreateNote = async () => {
    // Find the default notebook
    const defaultNotebook = notebooks?.find(notebook => notebook.isDefault);
    
    if (!defaultNotebook) {
      notifications.show({
        title: 'Error',
        message: 'No default notebook found. Please create a notebook first.',
        color: 'red',
      });
      return;
    }

    try {
      const newNote = await createNoteMutation.mutateAsync({
        notebookId: defaultNotebook.id,
        note: {
          title: 'New Note',
          content: '',
        },
      });
      
      // Navigate to the new note
      navigate(`/notes/${newNote.id}`);
      
      notifications.show({
        title: 'Success',
        message: 'Note created successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating note:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create note',
        color: 'red',
      });
    }
  };

  return (
    <Paper 
      shadow="sm" 
      p="xl" 
      radius="md" 
      withBorder
      style={{
        background: 'linear-gradient(135deg, rgba(34, 139, 230, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
      }}
    >
      <Group justify="center" gap="md">
        <Button
          size="lg"
          leftSection={<IconNote size={20} />}
          onClick={handleCreateNote}
          loading={createNoteMutation.isPending}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
        >
          Create New Note
        </Button>
        <Button
          size="lg"
          leftSection={<IconPlus size={20} />}
          onClick={onCreateTask}
          variant="gradient"
          gradient={{ from: 'grape', to: 'pink', deg: 90 }}
        >
          Create New Task
        </Button>
      </Group>
    </Paper>
  );
}

