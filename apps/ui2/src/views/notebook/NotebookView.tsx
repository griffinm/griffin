import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Title,
  Text,
  Stack,
  Center,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  ActionIcon,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconNotebook, IconNote, IconArrowLeft, IconSearch, IconX, IconPin } from '@tabler/icons-react';
import { useNotesByNotebook, useCreateNote } from '@/hooks/useNotes';
import { useNotebook, useNotebooks } from '@/hooks/useNotebooks';
import { NoteCard } from './NoteCard';
import { SearchResultCard } from './SearchResultCard';
import { useMemo, useState, useCallback } from 'react';
import { CreateNotebookModal } from '@/views/NoteTree/CreateNotebookModal';
import { notifications } from '@mantine/notifications';
import { useNotebookSearch } from '@/hooks/useNotebookSearch';
import { ActionPanel } from '@/components/ActionPanel';
import { useOpenNote } from '@/hooks/useOpenNote';
import { getNotebookPathSegments } from '@/utils/notebookPath';
import { TagManager } from '@/components/TagManager/TagManager';
import {
  useNotebookDefaultTags,
  useAddNotebookDefaultTag,
  useRemoveNotebookDefaultTag,
} from '@/hooks/useNotebookDefaultTags';
import { Tag } from '@/types/tag';

export function NotebookView() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const { openNote } = useOpenNote();
  const [createNotebookModalOpen, setCreateNotebookModalOpen] = useState(false);
  const createNoteMutation = useCreateNote();
  
  const { data: notebook, isLoading: notebookLoading, error: notebookError } = useNotebook(notebookId || '');
  const { data: notes, isLoading: notesLoading, error: notesError } = useNotesByNotebook(notebookId || '');
  const { data: allNotebooks } = useNotebooks();
  const { data: defaultTags } = useNotebookDefaultTags(notebookId || '');
  const addDefaultTag = useAddNotebookDefaultTag(notebookId || '');
  const removeDefaultTag = useRemoveNotebookDefaultTag(notebookId || '');
  const { searchTerm, setSearchTerm, results: searchResults, isSearching, isLoading: searchLoading, clearSearch } = useNotebookSearch(notebookId || '');

  const getNotebookPath = useCallback((nbId: string) => {
    return getNotebookPathSegments(nbId, allNotebooks);
  }, [allNotebooks]);

  // Sort notes by updatedAt (most recent first)
  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [notes]);

  // Pinned direct-child notes, most recently pinned first
  const pinnedNotes = useMemo(() => {
    return sortedNotes
      .filter((note) => note.pinnedAt)
      .sort((a, b) => new Date(b.pinnedAt ?? 0).getTime() - new Date(a.pinnedAt ?? 0).getTime());
  }, [sortedNotes]);

  const handleNoteClick = (noteId: string, title?: string) => {
    openNote(noteId, title);
  };

  // Tags applied here become the notebook's default tags, seeded onto descendant notes.
  const handleDefaultTagsChange = async (newTags: Tag[]) => {
    const original = defaultTags || [];

    const removed = original.filter(
      (tag) => !newTags.some((newTag) => newTag.id === tag.id)
    );
    const added = newTags.filter(
      (tag) => !original.some((origTag) => origTag.id === tag.id)
    );

    try {
      for (const tag of removed) {
        await removeDefaultTag.mutateAsync(tag.id);
      }
      for (const tag of added) {
        await addDefaultTag.mutateAsync(tag.id);
      }
    } catch (error) {
      console.error('Error updating default tags:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update default tags',
        color: 'red',
      });
    }
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

      // Open the new note in a tab
      openNote(newNote.id, newNote.title);
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
          <Group gap="xs" align="center" wrap="nowrap">
            <Text size="sm" c="dimmed">
              Default tags:
            </Text>
            <TagManager
              tags={defaultTags || []}
              onChange={handleDefaultTagsChange}
              placeholder="Add default tags..."
            />
          </Group>
        </Group>

        {/* Search Bar */}
        <TextInput
          placeholder="Search notes in this notebook and sub-notebooks..."
          leftSection={<IconSearch size={18} />}
          rightSection={
            searchTerm ? (
              <ActionIcon variant="subtle" onClick={clearSearch} size="sm">
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
        />

        {/* Stats & Actions */}
        <ActionPanel>
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
        </ActionPanel>

        {/* Notes Grid / Search Results */}
        {isSearching ? (
          // Search Results Mode
          searchLoading ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} height={180} radius="md" />
              ))}
            </SimpleGrid>
          ) : searchResults?.noteResults && searchResults.noteResults.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {searchResults.noteResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  notebookPath={getNotebookPath(result.notebookId)}
                  onClick={() => handleNoteClick(result.id, result.title)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconSearch size={64} style={{ opacity: 0.3 }} />
                  <div style={{ textAlign: 'center' }}>
                    <Text size="lg" fw={500} mb="xs">
                      No results found
                    </Text>
                    <Text size="sm" c="dimmed">
                      Try a different search term
                    </Text>
                  </div>
                </Stack>
              </Center>
            </Paper>
          )
        ) : (
          // Normal Notes Mode
          notebookLoading || notesLoading ? (
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
            <Stack gap="xl">
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <Stack gap="md">
                  <Group gap="xs">
                    <IconPin size={18} />
                    <Text fw={600}>Pinned</Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleNoteClick(note.id, note.title)}
                      />
                    ))}
                  </SimpleGrid>
                </Stack>
              )}

              {/* All Notes */}
              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                {sortedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => handleNoteClick(note.id, note.title)}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          )
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

