import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

interface DraggableTaskProps {
  task: Task;
  isLastTask: boolean;
  lastTaskElementRef: (_node: HTMLDivElement | null) => void;
}

/**
 * Wraps the presentational TaskCard with @dnd-kit sortable behavior and the
 * infinite-scroll sentinel ref. The drag listeners are attached to a dedicated
 * handle inside the card (not the whole card) so that clicking the card opens
 * the detail modal while dragging only starts from the grip handle.
 */
export function DraggableTask({ task, isLastTask, lastTaskElementRef }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: task,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (isLastTask) lastTaskElementRef(node);
      }}
      data-task-id={task.id}
      style={style}
      className="w-full min-w-0"
    >
      <TaskCard task={task} dragHandle={{ attributes, listeners }} />
    </div>
  );
}
