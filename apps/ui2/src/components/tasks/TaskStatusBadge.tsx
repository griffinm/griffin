import { Badge, Menu } from '@mantine/core';
import { TaskStatus } from '@/types/task';
import { IconChevronDown } from '@tabler/icons-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  onChange?: (status: TaskStatus) => void;
  disabled?: boolean;
}

export function TaskStatusBadge({ status, onChange, disabled = false }: TaskStatusBadgeProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'blue';
      case TaskStatus.IN_PROGRESS:
        return 'orange';
      case TaskStatus.COMPLETED:
        return 'green';
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
      default:
        return status;
    }
  };

  // If no onChange handler provided, render as non-interactive badge
  if (!onChange || disabled) {
    return (
      <Badge color={getStatusColor(status)} variant="light">
        {getStatusLabel(status)}
      </Badge>
    );
  }

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Badge 
          color={getStatusColor(status)} 
          variant="light"
          style={{ cursor: 'pointer' }}
          rightSection={<IconChevronDown size={12} />}
        >
          {getStatusLabel(status)}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Change status</Menu.Label>
        {Object.values(TaskStatus).map((statusOption) => (
          <Menu.Item
            key={statusOption}
            onClick={() => onChange(statusOption)}
            color={status === statusOption ? getStatusColor(statusOption) : undefined}
            style={{ fontWeight: status === statusOption ? 600 : 400 }}
          >
            {getStatusLabel(statusOption)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

