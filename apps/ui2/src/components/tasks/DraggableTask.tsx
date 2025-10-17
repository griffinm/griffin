import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '@/types/task';

interface DraggableTaskProps {
  task: Task;
  isLastTask: boolean;
  lastTaskElementRef: (node: HTMLDivElement | null) => void;
}

export function DraggableTask({ task, isLastTask, lastTaskElementRef }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (isLastTask) {
          lastTaskElementRef(node);
        }
      }}
      data-task-id={task.id}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow min-w-0 cursor-grab active:cursor-grabbing"
    >
      <h4 className="mb-2 text-sm font-medium text-gray-900 break-words">{task.title}</h4>
      {task.description && (
        <p className="mb-2 text-xs text-gray-600 break-words">
          {task.description}
        </p>
      )}
      <div className="flex justify-between items-center text-xs min-w-0">
        <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
          task.priority === TaskPriority.HIGH 
            ? 'bg-red-100 text-red-800' 
            : task.priority === TaskPriority.MEDIUM 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-gray-500 text-right flex-shrink-0 ml-2">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
