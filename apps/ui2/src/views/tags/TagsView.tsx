import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  Pill,
  Popover,
  Checkbox,
  MultiSelect,
  Paper,
  SimpleGrid,
  ActionIcon,
  Modal,
} from '@mantine/core';
import { IconTag, IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { searchTags, createTag, updateTag, deleteTag, getTagObjects } from '@/api/tagsApi';
import { Tag } from '@/types/tag';
import { Note } from '@/types/note';
import { Task } from '@/types/task';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { TaskCard } from '@/components/tasks';
import { NoteCard } from '@/views/notebook';
import { useNavigate } from 'react-router-dom';
import { getUrl } from '@/constants/urls';
import { getTagColors } from '@/utils/tagColors';

export function TagsView() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [logicMode, setLogicMode] = useState<'OR' | 'AND'>('OR');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [colorPickerTagId, setColorPickerTagId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  // Load all tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  // Load filtered objects when selection changes
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      loadFilteredObjects();
    } else {
      setFilteredNotes([]);
      setFilteredTasks([]);
    }
  }, [selectedTagIds, logicMode]);

  // Sort tasks by completion status, priority, and date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First, not completed tasks come before completed
    const aCompleted = a.status === 'COMPLETED';
    const bCompleted = b.status === 'COMPLETED';
    
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }
    
    // For not completed tasks, sort by priority
    if (!aCompleted) {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const aPriority = priorityOrder[a.priority] ?? 3;
      const bPriority = priorityOrder[b.priority] ?? 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
    }
    
    // Finally, sort by most recent (updatedAt)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const loadTags = async () => {
    try {
      const allTags = await searchTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load tags',
        color: 'red',
      });
    }
  };

  const loadFilteredObjects = async () => {
    setLoading(true);
    try {
      const result = await getTagObjects(selectedTagIds, logicMode);
      setFilteredNotes(result.notes);
      setFilteredTasks(result.tasks);
    } catch (error) {
      console.error('Error loading filtered objects:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load filtered items',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a tag name',
        color: 'red',
      });
      return;
    }

    try {
      await createTag(newTagName.trim());
      setNewTagName('');
      await loadTags();
      notifications.show({
        title: 'Success',
        message: 'Tag created successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create tag',
        color: 'red',
      });
    }
  };

  const handleColorChange = async (tagId: string, color: string) => {
    try {
      await updateTag(tagId, { color });
      await loadTags();
      setColorPickerTagId(null);
      notifications.show({
        title: 'Success',
        message: 'Tag color updated',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating tag color:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update tag color',
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;

    try {
      await deleteTag(tagToDelete.id);
      await loadTags();
      setSelectedTagIds(prev => prev.filter(id => id !== tagToDelete.id));
      notifications.show({
        title: 'Success',
        message: 'Tag deleted successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete tag',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group gap="xs" mb="xs">
            <IconTag size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={1}>Tags</Title>
          </Group>
          <Text size="lg" c="dimmed">
            Manage your tags and filter notes and tasks
          </Text>
        </div>

        {/* Tag Management */}
        <Paper p="md" withBorder>
          <Title order={3} mb="md">Manage Tags</Title>
          
          {/* Create Tag */}
          <Group gap="sm" mb="md">
            <TextInput
              placeholder="Enter tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreateTag}>
              Create Tag
            </Button>
          </Group>

          {/* All Tags */}
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">All Tags ({tags.length})</Text>
            <Group gap="sm">
              {tags.length === 0 ? (
                <Text c="dimmed" size="sm">No tags yet. Create one above!</Text>
              ) : (
                tags.map((tag) => {
                  const colors = getTagColors(tag.color);
                  return (
                    <Popover
                      key={tag.id}
                      opened={colorPickerTagId === tag.id}
                      onChange={(opened) => {
                        if (!opened) setColorPickerTagId(null);
                      }}
                      position="bottom"
                      withArrow
                    >
                      <Popover.Target>
                        <Group gap={4}>
                          <Pill
                            style={{
                              cursor: 'pointer',
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                            onClick={() => setColorPickerTagId(tag.id)}
                          >
                            {tag.name}
                          </Pill>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteClick(tag)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <ColorPicker
                          value={tag.color}
                          onChange={(color) => handleColorChange(tag.id, color)}
                        />
                      </Popover.Dropdown>
                    </Popover>
                  );
                })
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Filter Section */}
        <Paper p="md" withBorder>
          <Title order={3} mb="md">Filter by Tags</Title>
          <Stack gap="md">
            <MultiSelect
              placeholder="Select tags to filter..."
              data={tags.map(tag => ({ value: tag.id, label: tag.name }))}
              value={selectedTagIds}
              onChange={setSelectedTagIds}
              clearable
            />
            {selectedTagIds.length > 1 && (
              <Checkbox
                label="Require all selected tags (AND logic)"
                checked={logicMode === 'AND'}
                onChange={(e) => setLogicMode(e.currentTarget.checked ? 'AND' : 'OR')}
              />
            )}

            {/* Filtered Results */}
            {selectedTagIds.length > 0 && (
              <Stack gap="lg" mt="md">
                {/* Filtered Notes */}
                <div>
                  <Title order={4} mb="md">
                    Notes ({filteredNotes.length})
                  </Title>
                  {loading ? (
                    <Text c="dimmed">Loading...</Text>
                  ) : filteredNotes.length === 0 ? (
                    <Text c="dimmed">No notes found with selected tags</Text>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                      {filteredNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={() => navigate(getUrl('note').path(note.id))}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </div>

                {/* Filtered Tasks */}
                <div>
                  <Title order={4} mb="md">
                    Tasks ({sortedTasks.length})
                  </Title>
                  {loading ? (
                    <Text c="dimmed">Loading...</Text>
                  ) : sortedTasks.length === 0 ? (
                    <Text c="dimmed">No tasks found with selected tags</Text>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                      {sortedTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </SimpleGrid>
                  )}
                </div>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Tag"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the tag "{tagToDelete?.name}"? This will remove the tag from all notes and tasks.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

