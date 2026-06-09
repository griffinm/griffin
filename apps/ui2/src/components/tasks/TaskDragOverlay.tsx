import { DragOverlay } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { priorityMeta } from './taskVisuals';
import { DueChip } from './DueChip';

interface TaskDragOverlayProps {
  activeTask: Task | null;
}

export function TaskDragOverlay({ activeTask }: TaskDragOverlayProps) {
  return (
    <DragOverlay>
      {activeTask ? (
        <div className="flex min-w-0 rotate-2 overflow-hidden rounded-xl border border-[var(--at-line)] bg-[var(--mantine-color-body)] shadow-lg">
          <div className={`w-[3px] shrink-0 ${priorityMeta(activeTask.priority).railClass}`} />
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 break-words text-sm font-medium leading-snug text-[var(--mantine-color-text)]">
              {activeTask.title}
            </p>
            <DueChip task={activeTask} />
          </div>
        </div>
      ) : null}
    </DragOverlay>
  );
}
