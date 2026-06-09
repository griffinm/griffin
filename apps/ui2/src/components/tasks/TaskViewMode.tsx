import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Pill } from '@mantine/core';
import { format } from 'date-fns';
import { HtmlPreview } from '@/components/HtmlPreview';
import { getTagColors } from '@/utils/tagColors';
import { StatusHistory } from './StatusHistory';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { DueChip } from './DueChip';
import { MetaField } from './MetaField';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

interface TaskViewModeProps {
  task: Task;
}

export function TaskViewMode({ task }: TaskViewModeProps) {
  const queryClient = useQueryClient();
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
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (error) {
      console.error(`Error updating task ${label}:`, error);
      notifications.show({ title: 'Error', message: `Failed to update ${label}`, color: 'red' });
    }
  };

  const onStatus = (status: TaskStatus) => persist({ status }, 'status');
  const onPriority = (priority: TaskPriority) => persist({ priority }, 'priority');

  const tagPills =
    tags.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const colors = getTagColors(tag.color);
          return (
            <Pill key={tag.id} size="sm" style={{ backgroundColor: colors.bg, color: colors.text }}>
              {tag.name}
            </Pill>
          );
        })}
      </div>
    ) : null;

  return (
    <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
      {/* Main reading column */}
      <div className="min-w-0 flex-1 md:max-w-[720px]">
        <h1 className="font-display text-3xl font-medium leading-tight text-[var(--mantine-color-text)]">
          {task.title}
        </h1>

        {/* Compact meta strip — mobile only */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:hidden">
          <TaskStatusBadge status={task.status} onChange={onStatus} />
          <TaskPriorityBadge priority={task.priority} onChange={onPriority} />
          <DueChip task={task} size={12} />
        </div>
        {tags.length > 0 && <div className="mt-3 md:hidden">{tagPills}</div>}

        {/* Description */}
        {task.description && (
          <section className="mt-8 border-t border-[var(--at-line)] pt-5">
            <div className="task-meta mb-3 text-[10px] text-[var(--mantine-color-dimmed)]">Description</div>
            <HtmlPreview html={task.description} />
          </section>
        )}

        {/* Status history */}
        {task.statusHistory && task.statusHistory.length > 0 && (
          <section className="mt-8 border-t border-[var(--at-line)] pt-5">
            <StatusHistory history={task.statusHistory} />
          </section>
        )}
      </div>

      {/* Meta rail — desktop */}
      <aside className="hidden shrink-0 md:block md:w-64">
        <div className="sticky top-2 flex flex-col gap-4 rounded-xl border border-[var(--at-line)] bg-[var(--mantine-color-body)] p-4 shadow-xs">
          <MetaField label="Status">
            <TaskStatusBadge status={task.status} onChange={onStatus} />
          </MetaField>
          <MetaField label="Priority" divider>
            <TaskPriorityBadge priority={task.priority} onChange={onPriority} />
          </MetaField>
          {task.dueDate && (
            <MetaField label="Due" divider>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-[var(--mantine-color-text)]">
                  {format(new Date(task.dueDate), 'PP')}
                </span>
                <DueChip task={task} />
              </div>
            </MetaField>
          )}
          {tags.length > 0 && (
            <MetaField label="Tags" divider>
              {tagPills}
            </MetaField>
          )}
          <MetaField label="Created" divider>
            <span className="font-mono text-xs text-[var(--mantine-color-text)]">
              {format(new Date(task.createdAt), 'PP · p')}
            </span>
          </MetaField>
          <MetaField label="Updated" divider>
            <span className="font-mono text-xs text-[var(--mantine-color-text)]">
              {format(new Date(task.updatedAt), 'PP · p')}
            </span>
          </MetaField>
          {task.completedAt && (
            <MetaField label="Completed" divider>
              <span className="font-mono text-xs text-[var(--mantine-color-text)]">
                {format(new Date(task.completedAt), 'PP · p')}
              </span>
            </MetaField>
          )}
        </div>
      </aside>
    </div>
  );
}
