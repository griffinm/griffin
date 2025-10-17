import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '@/types/task';
import { TruncatedDescription } from './TruncatedDescriptoin';
import { Text } from '@mantine/core';
import { TaskColumn } from './TaskColumn';
import { formatDistanceToNowStrict } from 'date-fns';
import classNames from 'classnames';

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
      className="border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow min-w-0 cursor-grab active:cursor-grabbing w-full"
    >
      <TaskContent task={task} />
    </div>
  );
}

function TaskContent({ task }: { task: Task }) {
  const isNotCompleted = !task?.completedAt;
  const priorityClasses = classNames('h-full w-[10px] rounded-l-md', {
    'bg-red-400': task.priority === TaskPriority.HIGH,
    'bg-yellow-400': task.priority === TaskPriority.MEDIUM,
    'bg-green-400': task.priority === TaskPriority.LOW,
  });

  function renderCompletedTaskFooter() {
    if (!task.completedAt) {
      return null;
    }

    return (
      <div className="flex justify-end mt-2">
        <p className="text-xs text-gray-500">
          Completed: {formatDistanceToNowStrict(new Date(task.completedAt), { addSuffix: true })}
        </p>
      </div>
    );
  }

  function renderIncompleteTaskFooter() {
    if (!task.dueDate) {
      return null;
    }
    
    return (
      <div className="flex justify-end">
        <p className="text-xs text-gray-500">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
      <div className="flex flex-row h-full gap-2 w-full flex-1">
        <div className={priorityClasses} />

        <div className="flex flex-col h-full justify-between flex-1 p-2">
          <p className="text-md font-medium mb-1">{task.title}</p>

          {task.description && (
            <TruncatedDescription description={task.description} />
          )}

          {/* Due Date Footer */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500">
              {task.dueDate && formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })}
            </div>

            {task.dueDate && (
              <div>
                {isNotCompleted && renderIncompleteTaskFooter()}
                {!isNotCompleted && renderCompletedTaskFooter()}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
