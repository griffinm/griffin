import { Card, Text, Group, Badge, ActionIcon, HoverCard } from '@mantine/core';
import { IconEye, IconCalendar, IconExternalLink } from '@tabler/icons-react';
import { formatDistanceToNowStrict, isPast } from 'date-fns';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { useNavigate } from 'react-router-dom';

interface UpcomingTaskCardProps {
  task: Task;
  onClick: () => void;
}

export function UpcomingTaskCard({ task, onClick }: UpcomingTaskCardProps) {
  const navigate = useNavigate();

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'red';
      case TaskPriority.MEDIUM:
        return 'yellow';
      case TaskPriority.LOW:
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'gray';
      case TaskStatus.IN_PROGRESS:
        return 'blue';
      case TaskStatus.COMPLETED:
        return 'green';
      default:
        return 'gray';
    }
  };

  const getDueDateText = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const isOverdue = isPast(dueDate) && !task.completedAt;
    
    return {
      text: formatDistanceToNowStrict(dueDate, { addSuffix: true }),
      isOverdue,
    };
  };

  const dueDateInfo = getDueDateText();

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on the preview icon or open-in-page icon
    if ((e.target as HTMLElement).closest('[data-preview-icon]') || 
        (e.target as HTMLElement).closest('[data-open-in-page]')) {
      return;
    }
    onClick();
  };

  const handleOpenInPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tasks/${task.id}`);
  };

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="md"
      withBorder
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--mantine-shadow-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          },
        },
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Text size="md" fw={600} lineClamp={1} style={{ flex: 1 }}>
          {task.title}
        </Text>
        <Group gap={4}>
          <ActionIcon 
            variant="subtle" 
            size="sm"
            data-open-in-page
            onClick={handleOpenInPage}
            title="Open in page"
          >
            <IconExternalLink size={16} />
          </ActionIcon>
          <HoverCard width={400} shadow="md" openDelay={200}>
            <HoverCard.Target>
              <ActionIcon 
                variant="subtle" 
                size="sm"
                data-preview-icon
                onClick={(e) => e.stopPropagation()}
              >
                <IconEye size={16} />
              </ActionIcon>
            </HoverCard.Target>
          <HoverCard.Dropdown>
            <Text size="sm" fw={600} mb="xs">
              {task.title}
            </Text>
            {task.description && (
              <Text size="xs" c="dimmed" mb="xs" style={{ whiteSpace: 'pre-wrap' }}>
                {task.description}
              </Text>
            )}
            <Group gap="xs">
              <Badge size="xs" color={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge size="xs" color={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              {dueDateInfo && (
                <Badge size="xs" color={dueDateInfo.isOverdue ? 'red' : 'gray'}>
                  {dueDateInfo.text}
                </Badge>
              )}
            </Group>
          </HoverCard.Dropdown>
        </HoverCard>
        </Group>
      </Group>

      <Group gap="xs" mb="xs">
        <Badge size="sm" color={getPriorityColor(task.priority)} variant="light">
          {task.priority}
        </Badge>
        <Badge size="sm" color={getStatusColor(task.status)} variant="light">
          {task.status.replace('_', ' ')}
        </Badge>
      </Group>

      {dueDateInfo && (
        <Group gap={4}>
          <IconCalendar size={14} style={{ opacity: 0.6 }} />
          <Text 
            size="xs" 
            c={dueDateInfo.isOverdue ? 'red' : 'dimmed'}
            fw={dueDateInfo.isOverdue ? 600 : 400}
          >
            {dueDateInfo.text}
          </Text>
        </Group>
      )}
    </Card>
  );
}

