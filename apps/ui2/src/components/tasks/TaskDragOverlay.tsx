import { DragOverlay } from '@dnd-kit/core';
import { Task } from '@/types/task';

interface TaskDragOverlayProps {
  activeTask: Task | null;
}

export function TaskDragOverlay({ activeTask }: TaskDragOverlayProps) {
  return (
    <DragOverlay>
      {activeTask ? (
        <div className="border border-[var(--mantine-color-gray-4)] rounded-lg p-3 bg-[var(--mantine-color-body)] shadow-lg opacity-90 rotate-3">
          <h4 className="mb-2 text-sm font-medium text-[var(--mantine-color-text)] break-words">{activeTask.title}</h4>
          {activeTask.description && (
            <p className="mb-2 text-xs text-[var(--mantine-color-dimmed)] break-words">
              {activeTask.description}
            </p>
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
