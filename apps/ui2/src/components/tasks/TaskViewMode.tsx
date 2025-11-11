import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Stack, Text, Group, Badge, Pill } from '@mantine/core';
import { format } from 'date-fns';
import { HtmlPreview } from '@/components/HtmlPreview';
import { getTagColors } from '@/utils/tagColors';
import { StatusHistory } from './StatusHistory';

interface TaskViewModeProps {
  task: Task;
}

export function TaskViewMode({ task }: TaskViewModeProps) {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'red';
      case TaskPriority.MEDIUM:
        return 'yellow';
      case TaskPriority.LOW:
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'blue';
      case TaskStatus.IN_PROGRESS:
        return 'orange';
      case TaskStatus.COMPLETED:
        return 'green';
      case TaskStatus.CANCELLED:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.COMPLETED:
        return 'Completed';
      case TaskStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
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
          <Badge color={getStatusColor(task.status)} variant="light">
            {getStatusLabel(task.status)}
          </Badge>
        </div>
        
        <div>
          <Text size="xs" c="dimmed" mb={4}>Priority</Text>
          <Badge color={getPriorityColor(task.priority)} variant="light">
            {task.priority}
          </Badge>
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
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '12px',
            minHeight: '100px',
          }}>
            <HtmlPreview html={task.description} />
          </div>
        </div>
      )}

      {/* Status History */}
      {task.statusHistory && task.statusHistory.length > 1 && (
        <div>
          <Text size="xs" c="dimmed" mb={8}>Status History</Text>
          <StatusHistory history={task.statusHistory} />
        </div>
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

