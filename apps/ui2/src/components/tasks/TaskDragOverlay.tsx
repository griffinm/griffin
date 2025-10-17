import { DragOverlay } from '@dnd-kit/core';
import { Task } from '@/types/task';

interface TaskDragOverlayProps {
  activeTask: Task | null;
}

export function TaskDragOverlay({ activeTask }: TaskDragOverlayProps) {
  return (
    <DragOverlay>
      {activeTask ? (
        <div className="border border-gray-300 rounded-lg p-3 bg-white shadow-lg opacity-90 rotate-3">
          <h4 className="mb-2 text-sm font-medium text-gray-900 break-words">{activeTask.title}</h4>
          {activeTask.description && (
            <p className="mb-2 text-xs text-gray-600 break-words">
              {activeTask.description}
            </p>
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
