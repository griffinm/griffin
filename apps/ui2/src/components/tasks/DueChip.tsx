import { Task } from '@/types/task';
import { IconClock, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { dueMeta, DueTone } from './taskVisuals';

const toneClasses: Record<DueTone, string> = {
  done: 'text-[var(--mantine-color-teal-text)]',
  overdue: 'text-[var(--mantine-color-red-text)]',
  soon: 'text-[var(--mantine-color-orange-text)]',
  normal: 'text-[var(--mantine-color-dimmed)]',
};

const toneIcon: Record<DueTone, typeof IconClock> = {
  done: IconCircleCheck,
  overdue: IconAlertTriangle,
  soon: IconClock,
  normal: IconClock,
};

/**
 * The single, canonical due/completed indicator (mono "system" texture).
 * Replaces the duplicated relative + absolute date footers.
 */
export function DueChip({ task, size = 11 }: { task: Task; size?: number }) {
  const meta = dueMeta(task);
  if (!meta) return null;

  const Icon = toneIcon[meta.tone];
  return (
    <span
      className={`task-meta inline-flex items-center gap-1 leading-none ${toneClasses[meta.tone]}`}
      style={{ fontSize: size }}
    >
      <Icon size={size + 2} stroke={2} />
      {meta.label}
    </span>
  );
}
