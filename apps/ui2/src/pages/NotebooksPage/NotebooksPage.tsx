import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Skeleton, 
  Center,
  SimpleGrid,
  Button,
  TextInput,
  Paper,
} from '@mantine/core';
import { 
  IconBook,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconX,
  IconCheck,
} from '@tabler/icons-react';
import { useNotebooks, useCreateNotebook } from '@/hooks';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { NotebookCard } from '@/components/notebooks/NotebookCard';
import { notifications } from '@mantine/notifications';

export function NotebooksPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  
  // Fetch all notebooks
  const { data: notebooks, isLoading } = useNotebooks();
  const createNotebookMutation = useCreateNotebook();

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a notebook title',
        color: 'red',
      });
      return;
    }

    try {
      const newNotebook = await createNotebookMutation.mutateAsync({
        title: newNotebookTitle,
        description: '',
      });

      notifications.show({
        title: 'Success',
        message: 'Notebook created successfully',
        color: 'green',
      });

      // Reset form
      setNewNotebookTitle('');
      setShowCreateForm(false);

      // Navigate to the newly created notebook
      navigate(`/notebooks/${newNotebook.id}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create notebook',
        color: 'red',
      });
    }
  };

  const handleCancelCreate = () => {
    setNewNotebookTitle('');
    setShowCreateForm(false);
  };

  // Filter notebooks based on search query
  const filteredNotebooks = notebooks?.filter(notebook => 
    notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notebook.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Separate top-level and child notebooks
  const topLevelNotebooks = filteredNotebooks.filter(nb => !nb.parentId);
  const childNotebooks = filteredNotebooks.filter(nb => nb.parentId);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group gap="xs" mb="xs">
            <IconBook size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={1}>Notebooks</Title>
          </Group>
          <Text size="lg" c="dimmed">
            Organize your notes into notebooks
          </Text>
        </div>

        {/* Search and Actions */}
        <Group justify="space-between">
          <TextInput
            placeholder="Search notebooks..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              navigate('/notebooks/create');
            }}
          >
            New Notebook
          </Button>
        </Group>

        {/* Top Level Notebooks Section */}
        <DashboardSection
          title="My Notebooks"
          icon={<IconBook size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />}
          count={topLevelNotebooks.length}
        >
          {isLoading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} height={140} radius="md" />
              ))}
            </SimpleGrid>
          ) : topLevelNotebooks.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {topLevelNotebooks.map(notebook => (
                <NotebookCard 
                  key={notebook.id} 
                  notebook={notebook}
                  onEdit={(nb) => {
                    navigate(`/notebooks/${nb.id}/edit`);
                  }}
                  onDelete={(nb) => {
                    navigate(`/notebooks/${nb.id}/delete`);
                  }}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl">
              {searchQuery ? (
                <Stack align="center" gap="md">
                  <IconBook size={48} style={{ opacity: 0.3 }} />
                  <Text c="dimmed">No notebooks found</Text>
                  <Text size="sm" c="dimmed">Try adjusting your search</Text>
                </Stack>
              ) : showCreateForm ? (
                <Paper p="lg" radius="md" withBorder shadow="sm" style={{ maxWidth: 500, width: '100%' }}>
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconSparkles size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
                      <Text fw={600} size="lg">Create Your First Notebook</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Give your notebook a name to get started organizing your notes
                    </Text>
                    <TextInput
                      placeholder="Enter notebook name..."
                      value={newNotebookTitle}
                      onChange={(e) => setNewNotebookTitle(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateNotebook();
                        } else if (e.key === 'Escape') {
                          handleCancelCreate();
                        }
                      }}
                      size="md"
                      autoFocus
                    />
                    <Group justify="flex-end" gap="xs">
                      <Button
                        variant="subtle"
                        color="gray"
                        onClick={handleCancelCreate}
                        leftSection={<IconX size={16} />}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateNotebook}
                        loading={createNotebookMutation.isPending}
                        leftSection={<IconCheck size={16} />}
                      >
                        Create Notebook
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ) : (
                <Stack align="center" gap="lg" py="xl">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--mantine-color-blue-1) 0%, var(--mantine-color-indigo-1) 100%)',
                    borderRadius: '50%',
                    padding: '2rem',
                  }}>
                    <IconBook size={64} style={{ color: 'var(--mantine-color-blue-6)' }} />
                  </div>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="xl">Start Your Journey</Text>
                    <Text c="dimmed" size="sm" ta="center" maw={400}>
                      Create your first notebook and begin organizing your thoughts, ideas, and notes in one place
                    </Text>
                  </Stack>
                  <Button
                    size="lg"
                    leftSection={<IconSparkles size={20} />}
                    onClick={() => setShowCreateForm(true)}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
                  >
                    Create Your First Notebook
                  </Button>
                </Stack>
              )}
            </Center>
          )}
        </DashboardSection>

        {/* Child Notebooks Section - Only show if there are any */}
        {childNotebooks.length > 0 && (
          <DashboardSection
            title="All Notebooks"
            icon={<IconBook size={24} style={{ color: 'var(--mantine-color-grape-6)' }} />}
            count={childNotebooks.length}
          >
            <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="md">
              {childNotebooks.map(notebook => (
                <NotebookCard 
                  key={notebook.id} 
                  notebook={notebook}
                  onEdit={(nb) => {
                    navigate(`/notebooks/${nb.id}/edit`);
                  }}
                  onDelete={(nb) => {
                    navigate(`/notebooks/${nb.id}/delete`);
                  }}
                />
              ))}
            </SimpleGrid>
          </DashboardSection>
        )}
      </Stack>
    </Container>
  );
}

