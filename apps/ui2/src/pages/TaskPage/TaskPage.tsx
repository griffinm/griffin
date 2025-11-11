import { useParams, useNavigate } from 'react-router-dom';
import { Center, Loader, Text, Button, Container, Paper, Group, ActionIcon, Menu } from '@mantine/core';
import { IconEdit, IconArrowLeft, IconDots, IconTrash } from '@tabler/icons-react';
import { useTask } from '@/hooks/useTasks';
import { useState } from 'react';
import { TaskForm, TaskFormData } from '@/views/tasks';
import { updateTask, addTagToTask, removeTagFromTask, deleteTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { TaskViewMode } from '@/components/tasks/TaskViewMode';
import { ConfirmationModal } from '@/views/NoteTree/ConfirmationModal';

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: task, isLoading, error } = useTask(taskId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (formData: TaskFormData) => {
    if (!taskId || !task) return;

    try {
      // Update task
      await updateTask(taskId, {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        status: formData.status,
      });

      // Sync tags
      const originalTags = task.tags || [];
      const newTags = formData.tags || [];

      // Find removed tags
      const removedTags = originalTags.filter(
        (tag) => !newTags.some((newTag) => newTag.id === tag.id)
      );

      // Find added tags
      const addedTags = newTags.filter(
        (tag) => !originalTags.some((origTag) => origTag.id === tag.id)
      );

      // Remove tags
      for (const tag of removedTags) {
        await removeTagFromTask(taskId, tag.id);
      }

      // Add tags
      for (const tag of addedTags) {
        await addTagToTask(taskId, tag.name);
      }

      notifications.show({
        title: 'Success',
        message: 'Task updated successfully',
        color: 'green',
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task',
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;

    try {
      setIsDeleting(true);
      await deleteTask(taskId);
      
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully',
        color: 'green',
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Navigate back to tasks page
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task',
        color: 'red',
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !task) {
    return (
      <Center h="100%">
        <Text c="red">Error loading task</Text>
      </Center>
    );
  }

  return (
    <Container size="100%" py="xl" px="xl">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Group>
            <ActionIcon 
              variant="subtle" 
              color="gray"
              onClick={() => navigate('/tasks')}
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text size="lg" fw={600}>Task Details</Text>
          </Group>
          
          <Group>
            {!isEditing && (
              <>
                <Button
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setIsEditing(true)}
                  variant="light"
                >
                  Edit
                </Button>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="lg">
                      <IconDots size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Task actions</Menu.Label>
                    <Menu.Item 
                      color="red" 
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setDeleteModalOpened(true)}
                    >
                      Delete task
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </Group>
        </Group>

        {/* Content */}
        {isEditing ? (
          <TaskForm
            task={task}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <TaskViewMode task={task} />
        )}

      <ConfirmationModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </Container>
  );
}

