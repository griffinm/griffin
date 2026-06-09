import { Badge, Menu, UnstyledButton } from '@mantine/core';
import { TaskPriority } from '@/types/task';
import { IconChevronDown } from '@tabler/icons-react';
import { priorityMeta } from './taskVisuals';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  onChange?: (_priority: TaskPriority) => void;
  disabled?: boolean;
  /** 'badge' = Mantine pill (default); 'chip' = mono dot + label (Atelier board). */
  variant?: 'badge' | 'chip';
}

export function TaskPriorityBadge({
  priority,
  onChange,
  disabled = false,
  variant = 'badge',
}: TaskPriorityBadgeProps) {
  const meta = priorityMeta(priority);
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
        <Menu.Label>Change priority</Menu.Label>
        {Object.values(TaskPriority).map((priorityOption) => (
          <Menu.Item
            key={priorityOption}
            onClick={() => onChange(priorityOption)}
            color={priority === priorityOption ? priorityMeta(priorityOption).color : undefined}
            style={{ fontWeight: priority === priorityOption ? 600 : 400 }}
          >
            {priorityMeta(priorityOption).label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
