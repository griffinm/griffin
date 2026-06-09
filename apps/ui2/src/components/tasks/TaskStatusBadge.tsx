import { Badge, Menu, UnstyledButton } from '@mantine/core';
import { TaskStatus } from '@/types/task';
import { IconChevronDown } from '@tabler/icons-react';
import { statusMeta } from './taskVisuals';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  onChange?: (_status: TaskStatus) => void;
  disabled?: boolean;
  /** 'badge' = Mantine pill (default); 'chip' = mono dot + label (Atelier board). */
  variant?: 'badge' | 'chip';
}

export function TaskStatusBadge({
  status,
  onChange,
  disabled = false,
  variant = 'badge',
}: TaskStatusBadgeProps) {
  const meta = statusMeta(status);
  const interactive = !!onChange && !disabled;

  const target =
    variant === 'chip' ? (
      <UnstyledButton
        component="span"
        className="task-meta inline-flex items-center gap-1.5 text-[11px] text-[var(--mantine-color-text)] leading-none"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
        {meta.label}
        {interactive && <IconChevronDown size={11} className="opacity-50" />}
      </UnstyledButton>
    ) : (
      <Badge
        color={meta.color}
        variant="light"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        rightSection={interactive ? <IconChevronDown size={12} /> : undefined}
      >
        {meta.label}
      </Badge>
    );

  if (!interactive) {
    return target;
  }

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>{target}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Change status</Menu.Label>
        {Object.values(TaskStatus).map((statusOption) => (
          <Menu.Item
            key={statusOption}
            onClick={() => onChange(statusOption)}
            color={status === statusOption ? statusMeta(statusOption).color : undefined}
            style={{ fontWeight: status === statusOption ? 600 : 400 }}
          >
            {statusMeta(statusOption).label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
