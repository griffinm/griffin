import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { formatDistanceToNowStrict, isPast } from 'date-fns';

export interface StatusMeta {
  label: string;
  /** Mantine color name (for Badge / ThemeIcon). */
  color: string;
  /** Tailwind background class for a dot/marker. */
  dotClass: string;
}

export interface PriorityMeta {
  label: string;
  color: string;
  dotClass: string;
  /** Tailwind background class for the card's left rail. */
  railClass: string;
}

export function statusMeta(status: TaskStatus): StatusMeta {
  switch (status) {
    case TaskStatus.TODO:
      return { label: 'To Do', color: 'blue', dotClass: 'bg-blue-500' };
    case TaskStatus.IN_PROGRESS:
      return { label: 'In Progress', color: 'orange', dotClass: 'bg-orange-500' };
    case TaskStatus.COMPLETED:
      return { label: 'Completed', color: 'teal', dotClass: 'bg-teal-500' };
    default:
      return { label: String(status), color: 'gray', dotClass: 'bg-gray-400' };
  }
}

export function priorityMeta(priority: TaskPriority): PriorityMeta {
  switch (priority) {
    case TaskPriority.HIGH:
      return { label: 'High', color: 'red', dotClass: 'bg-red-500', railClass: 'bg-red-500' };
    case TaskPriority.MEDIUM:
      return { label: 'Medium', color: 'yellow', dotClass: 'bg-amber-400', railClass: 'bg-amber-400' };
    case TaskPriority.LOW:
      return { label: 'Low', color: 'green', dotClass: 'bg-emerald-400', railClass: 'bg-emerald-400' };
    default:
      return { label: String(priority), color: 'gray', dotClass: 'bg-gray-400', railClass: 'bg-gray-400' };
  }
}

/** Compact relative distance, e.g. "3d", "5h", "2mo" — for mono metadata. */
export function shortDistance(date: Date): string {
  return formatDistanceToNowStrict(date)
    .replace(/ seconds?/, 's')
    .replace(/ minutes?/, 'm')
    .replace(/ hours?/, 'h')
    .replace(/ days?/, 'd')
    .replace(/ weeks?/, 'w')
    .replace(/ months?/, 'mo')
    .replace(/ years?/, 'y');
}

export type DueTone = 'done' | 'overdue' | 'soon' | 'normal';

export interface DueMeta {
  label: string;
  tone: DueTone;
}

/** Single source of truth for how a task's due/completed state reads. */
export function dueMeta(task: Pick<Task, 'dueDate' | 'completedAt' | 'status'>): DueMeta | null {
  if (task.status === TaskStatus.COMPLETED || task.completedAt) {
    const when = task.completedAt ? shortDistance(new Date(task.completedAt)) : null;
    return { label: when ? `Done ${when} ago` : 'Done', tone: 'done' };
  }
  if (!task.dueDate) return null;

  const due = new Date(task.dueDate);
  const dist = shortDistance(due);
  if (isPast(due)) {
    return { label: `Overdue ${dist}`, tone: 'overdue' };
  }
  // "Soon" if due within ~2 days.
  const msUntil = due.getTime() - Date.now();
  const tone: DueTone = msUntil <= 2 * 24 * 60 * 60 * 1000 ? 'soon' : 'normal';
  return { label: `Due in ${dist}`, tone };
}
