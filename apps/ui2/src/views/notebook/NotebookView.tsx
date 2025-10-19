import { useParams, useNavigate } from 'react-router-dom';
import { Button, Title, Text, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconArrowLeft, IconNotebook } from '@tabler/icons-react';
import { useNotesByNotebook } from '@/hooks/useNotes';
import { useNotebook } from '@/hooks/useNotebooks';
import { NoteCard } from './NoteCard';
import { useMemo, useState } from 'react';
import { CreateNotebookModal } from '@/views/NoteTree/CreateNotebookModal';

export function NotebookView() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const [createNotebookModalOpen, setCreateNotebookModalOpen] = useState(false);
  
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

  const handleCreateNote = () => {
    // TODO: Open create note modal when it's implemented
    console.log('Create note for notebook:', notebookId);
  };

  if (notebookLoading || notesLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (notebookError || !notebook) {
    return (
      <div className="p-5">
        <Text c="red">Error loading notebook</Text>
      </div>
    );
  }

  if (notesError) {
    return (
      <div className="p-5">
        <Title order={2} mb="md">{notebook.title}</Title>
        <Text c="red">Error loading notes</Text>
      </div>
    );
  }

  return (
    <div className="p-5 w-full">
      <div className="mb-6">

        <div className="flex justify-between items-center">
          <div>
            <Title order={2}>{notebook.title}</Title>
            {notebook.description && (
              <Text c="dimmed" size="sm" mt="xs">
                {notebook.description}
              </Text>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              leftSection={<IconNotebook size={18} />}
              onClick={() => setCreateNotebookModalOpen(true)}
              variant="default"
            >
              Create Notebook
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={handleCreateNote}
            >
              Create Note
            </Button>
          </div>
        </div>
      </div>

      {sortedNotes.length === 0 ? (
        <Center h={200}>
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              No notes in this notebook yet
            </Text>
            <Button
              size="lg"
              leftSection={<IconPlus size={20} />}
              onClick={handleCreateNote}
            >
              Create Your First Note
            </Button>
          </Stack>
        </Center>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note.id)}
            />
          ))}
        </div>
      )}

      <CreateNotebookModal 
        opened={createNotebookModalOpen}
        onClose={() => setCreateNotebookModalOpen(false)}
        parentId={notebookId}
      />
    </div>
  );
}

