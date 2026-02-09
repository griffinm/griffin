import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Stack, Text, Group, Pill } from '@mantine/core';
import { format } from 'date-fns';
import { HtmlPreview } from '@/components/HtmlPreview';
import { getTagColors } from '@/utils/tagColors';
import { StatusHistory } from './StatusHistory';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

interface TaskViewModeProps {
  task: Task;
}

export function TaskViewMode({ task }: TaskViewModeProps) {
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: newStatus,
      });

      notifications.show({
        title: 'Success',
        message: 'Task status updated successfully',
        color: 'green',
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (error) {
      console.error('Error updating task status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task status',
        color: 'red',
      });
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: newPriority,
        status: task.status,
      });

      notifications.show({
        title: 'Success',
        message: 'Task priority updated successfully',
        color: 'green',
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (error) {
      console.error('Error updating task priority:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task priority',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="lg">
      {/* Title */}
      <div>
        <Text size="xl" fw={700} mb="md">
          {task.title}
        </Text>
      </div>

      {/* Metadata */}
      <Group gap="md">
        <div>
          <Text size="xs" c="dimmed" mb={4}>Status</Text>
          <TaskStatusBadge status={task.status} onChange={handleStatusChange} />
        </div>
        
        <div>
          <Text size="xs" c="dimmed" mb={4}>Priority</Text>
          <TaskPriorityBadge priority={task.priority} onChange={handlePriorityChange} />
        </div>
        
        {task.dueDate && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>Due Date</Text>
            <Text size="sm" fw={500}>
              {format(new Date(task.dueDate), 'PPP')}
            </Text>
          </div>
        )}
      </Group>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div>
          <Text size="xs" c="dimmed" mb={8}>Tags</Text>
          <Group gap="xs">
            {task.tags.map(tag => {
              const colors = getTagColors(tag.color);
              return (
                <Pill 
                  key={tag.id} 
                  size="sm"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                  }}
                >
                  {tag.name}
                </Pill>
              );
            })}
          </Group>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div>
          <Text size="xs" c="dimmed" mb={8}>Description</Text>
          <div style={{ 
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: '8px',
            padding: '12px',
            minHeight: '100px',
          }}>
            <HtmlPreview html={task.description} />
          </div>
        </div>
      )}

      {/* Status History */}
      {task.statusHistory && task.statusHistory.length > 0 && (
        <StatusHistory history={task.statusHistory} />
      )}

      {/* Timestamps */}
      <Group gap="xl">
        <div>
          <Text size="xs" c="dimmed" mb={4}>Created</Text>
          <Text size="sm">
            {format(new Date(task.createdAt), 'PPP p')}
          </Text>
        </div>
        
        <div>
          <Text size="xs" c="dimmed" mb={4}>Last Updated</Text>
          <Text size="sm">
            {format(new Date(task.updatedAt), 'PPP p')}
          </Text>
        </div>

        {task.completedAt && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>Completed</Text>
            <Text size="sm">
              {format(new Date(task.completedAt), 'PPP p')}
            </Text>
          </div>
        )}
      </Group>
    </Stack>
  );
}

