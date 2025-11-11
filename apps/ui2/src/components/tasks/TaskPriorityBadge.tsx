import { Badge, Menu } from '@mantine/core';
import { TaskPriority } from '@/types/task';
import { IconChevronDown } from '@tabler/icons-react';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  onChange?: (priority: TaskPriority) => void;
  disabled?: boolean;
}

export function TaskPriorityBadge({ priority, onChange, disabled = false }: TaskPriorityBadgeProps) {
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

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  };

  // If no onChange handler provided, render as non-interactive badge
  if (!onChange || disabled) {
    return (
      <Badge color={getPriorityColor(priority)} variant="light">
        {getPriorityLabel(priority)}
      </Badge>
    );
  }

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Badge 
          color={getPriorityColor(priority)} 
          variant="light"
          style={{ cursor: 'pointer' }}
          rightSection={<IconChevronDown size={12} />}
        >
          {getPriorityLabel(priority)}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Change priority</Menu.Label>
        {Object.values(TaskPriority).map((priorityOption) => (
          <Menu.Item
            key={priorityOption}
            onClick={() => onChange(priorityOption)}
            color={priority === priorityOption ? getPriorityColor(priorityOption) : undefined}
            style={{ fontWeight: priority === priorityOption ? 600 : 400 }}
          >
            {getPriorityLabel(priorityOption)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

