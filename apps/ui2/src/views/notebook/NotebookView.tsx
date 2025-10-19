import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Title, 
  Text, 
  Stack, 
  Loader, 
  Center, 
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconNotebook, IconNote, IconArrowLeft } from '@tabler/icons-react';
import { useNotesByNotebook, useCreateNote } from '@/hooks/useNotes';
import { useNotebook } from '@/hooks/useNotebooks';
import { NoteCard } from './NoteCard';
import { useMemo, useState } from 'react';
import { CreateNotebookModal } from '@/views/NoteTree/CreateNotebookModal';
import { notifications } from '@mantine/notifications';

export function NotebookView() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const [createNotebookModalOpen, setCreateNotebookModalOpen] = useState(false);
  const createNoteMutation = useCreateNote();
  
  const { data: notebook, isLoading: notebookLoading, error: notebookError } = useNotebook(notebookId || '');
  const { data: notes, isLoading: notesLoading, error: notesError } = useNotesByNotebook(notebookId || '');

  // Sort notes by updatedAt (most recent first)
  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [notes]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleCreateNote = async () => {
    if (!notebookId) return;

    try {
      const newNote = await createNoteMutation.mutateAsync({
        notebookId,
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

  if (notebookError || !notebook) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <IconNotebook size={64} style={{ opacity: 0.3 }} />
            <Text c="red" size="lg">Error loading notebook</Text>
            <Button onClick={() => navigate('/notebooks')} leftSection={<IconArrowLeft size={16} />}>
              Back to Notebooks
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (notesError) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="md">{notebook.title}</Title>
        <Text c="red">Error loading notes</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" mb="xs">
              <ActionIcon 
                variant="subtle" 
                onClick={() => navigate('/notebooks')}
                size="lg"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={1}>{notebookLoading ? 'Loading...' : notebook.title}</Title>
            </Group>
            {notebook.description && (
              <Text size="md" c="dimmed" ml={44}>
                {notebook.description}
              </Text>
            )}
          </div>
        </Group>

        {/* Stats & Actions */}
        <Paper 
          shadow="sm" 
          p="lg" 
          radius="md" 
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="lg">
              <div>
                <Text size="xl" fw={700}>
                  {notesLoading ? '-' : sortedNotes.length}
                </Text>
                <Text size="sm" c="dimmed">
                  {sortedNotes.length === 1 ? 'Note' : 'Notes'}
                </Text>
              </div>
            </Group>
            
            <Group gap="sm">
              <Button
                leftSection={<IconNotebook size={18} />}
                onClick={() => setCreateNotebookModalOpen(true)}
                variant="light"
              >
                New Notebook
              </Button>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={handleCreateNote}
                loading={createNoteMutation.isPending}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              >
                Create Note
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Notes Grid */}
        {notebookLoading || notesLoading ? (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
          </SimpleGrid>
        ) : sortedNotes.length === 0 ? (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconNote size={64} style={{ opacity: 0.3 }} />
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" fw={500} mb="xs">
                    No notes in this notebook yet
                  </Text>
                  <Text size="sm" c="dimmed" mb="md">
                    Create your first note to get started with this notebook
                  </Text>
                </div>
                <Button
                  size="lg"
                  leftSection={<IconPlus size={20} />}
                  onClick={handleCreateNote}
                  loading={createNoteMutation.isPending}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                >
                  Create Your First Note
                </Button>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note.id)}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <CreateNotebookModal 
        opened={createNotebookModalOpen}
        onClose={() => setCreateNotebookModalOpen(false)}
        parentId={notebookId}
      />
    </Container>
  );
}

