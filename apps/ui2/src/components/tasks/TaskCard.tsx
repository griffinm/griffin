import { Task, TaskPriority, TaskStatus } from '@/types/task';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useState } from 'react';
import { TaskModal } from './TaskModal';
import { ActionIcon, Pill } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';
import { useNavigate } from 'react-router-dom';
import { IconExternalLink, IconGripVertical } from '@tabler/icons-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { DueChip } from './DueChip';
import { priorityMeta } from './taskVisuals';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

const MAX_VISIBLE_TAGS = 3;

interface TaskCardProps {
  task: Task;
  /** Show the interactive status control (default true). */
  showStatusControl?: boolean;
  /** dnd-kit attributes/listeners for the dedicated drag handle (board desktop only). */
  dragHandle?: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners };
}

/**
 * Presentational + interactive task card for the board (cols view).
 * On desktop it's wrapped by DraggableTask (which supplies a drag handle);
 * on mobile it's rendered directly.
 */
export function TaskCard({ task, showStatusControl = true, dragHandle }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const rail = priorityMeta(task.priority).railClass;
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - visibleTags.length;

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

  const handleOpenInPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/tasks/${task.id}`);
  };

  // Stop the card's open-modal click from firing on interactive control clusters.
  const stop = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  };

  return (
    <>
      <div
        className="group relative flex min-w-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--at-line)] bg-[var(--mantine-color-body)] shadow-xs transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
        onClick={() => setShowModal(true)}
      >
        <div className={`w-[3px] shrink-0 ${rail}`} />

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          {/* Title */}
          <div className="flex items-start gap-1.5">
            {dragHandle && (
              <button
                type="button"
                {...dragHandle.attributes}
                {...dragHandle.listeners}
                onClick={(e) => e.stopPropagation()}
                className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none text-[var(--mantine-color-dimmed)] opacity-0 transition-opacity hover:text-[var(--mantine-color-text)] active:cursor-grabbing group-hover:opacity-100"
                aria-label="Drag to move"
                title="Drag to move"
              >
                <IconGripVertical size={15} />
              </button>
            )}
            <p className="line-clamp-2 flex-1 break-words text-sm font-medium leading-snug text-[var(--mantine-color-text)]">
              {task.title}
            </p>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={handleOpenInPage}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              title="Open in page"
            >
              <IconExternalLink size={15} />
            </ActionIcon>
          </div>

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {visibleTags.map((tag) => {
                const colors = getTagColors(tag.color);
                return (
                  <Pill key={tag.id} size="xs" style={{ backgroundColor: colors.bg, color: colors.text }}>
                    {tag.name}
                  </Pill>
                );
              })}
              {overflow > 0 && (
                <span className="task-meta text-[10px] text-[var(--mantine-color-dimmed)]">+{overflow}</span>
              )}
            </div>
          )}

          {/* Meta footer: status · priority — due */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1" {...stop}>
              {showStatusControl && (
                <TaskStatusBadge
                  variant="chip"
                  status={task.status}
                  onChange={(status: TaskStatus) => persist({ status }, 'status')}
                />
              )}
              <TaskPriorityBadge
                variant="chip"
                priority={task.priority}
                onChange={(priority: TaskPriority) => persist({ priority }, 'priority')}
              />
            </div>
            <DueChip task={task} />
          </div>
        </div>
      </div>

      {showModal && <TaskModal task={task} open={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
