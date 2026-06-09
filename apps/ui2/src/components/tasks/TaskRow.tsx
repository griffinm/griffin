import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Pill } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { DueChip } from './DueChip';
import { priorityMeta } from './taskVisuals';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

/** Strip HTML to a single-line plain-text excerpt for the row's secondary line. */
function excerpt(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function TaskRow({
  task,
  setActiveTask,
}: {
  task: Task;
  setActiveTask: (_task: Task | null) => void;
  activeTask?: Task | null;
}) {
  const queryClient = useQueryClient();
  const desc = excerpt(task.description);
  const tags = task.tags ?? [];

  const persist = async (changes: Partial<Pick<Task, 'priority' | 'status'>>, label: string) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        ...changes,
      });
      notifications.show({ title: 'Success', message: `Task ${label} updated`, color: 'green' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error(`Error updating task ${label}:`, error);
      notifications.show({ title: 'Error', message: `Failed to update ${label}`, color: 'red' });
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="group flex cursor-pointer flex-col gap-2 px-3.5 py-3 transition-colors hover:bg-[var(--mantine-color-default-hover)] sm:flex-row sm:items-center sm:gap-4"
      onClick={() => setActiveTask(task)}
    >
      {/* Priority dot + title + excerpt */}
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityMeta(task.priority).dotClass}`}
          title={`${priorityMeta(task.priority).label} priority`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[var(--mantine-color-text)]">{task.title}</div>
          {desc && <div className="mt-0.5 truncate text-xs text-[var(--mantine-color-dimmed)]">{desc}</div>}
        </div>
      </div>

      {/* Meta cluster — wraps under the title on mobile, right-aligned columns on desktop */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[18px] sm:flex-nowrap sm:justify-end sm:pl-0">
        {tags.length > 0 && (
          <div className="hidden max-w-[160px] items-center gap-1 overflow-hidden md:flex">
            {tags.slice(0, 2).map((tag) => {
              const colors = getTagColors(tag.color);
              return (
                <Pill key={tag.id} size="xs" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {tag.name}
                </Pill>
              );
            })}
            {tags.length > 2 && (
              <span className="task-meta text-[10px] text-[var(--mantine-color-dimmed)]">+{tags.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex justify-end sm:w-[120px]" onClick={stop}>
          <TaskStatusBadge status={task.status} onChange={(status: TaskStatus) => persist({ status }, 'status')} />
        </div>
        <div className="flex justify-end sm:w-[96px]" onClick={stop}>
          <TaskPriorityBadge
            priority={task.priority}
            onChange={(priority: TaskPriority) => persist({ priority }, 'priority')}
          />
        </div>
        <div className="flex shrink-0 justify-end sm:w-[124px]">
          <DueChip task={task} />
        </div>
      </div>
    </div>
  );
}
