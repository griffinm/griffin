import { useInfiniteTasksByStatus, useUpdateTaskStatus } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority, Task, PagedTaskList } from '@/types/task';
import { useRef, useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
}

interface DraggableTaskProps {
  task: Task;
  isLastTask: boolean;
  lastTaskElementRef: (node: HTMLDivElement | null) => void;
}

function DraggableTask({ task, isLastTask, lastTaskElementRef }: DraggableTaskProps) {
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

function TaskColumn({ status, title }: TaskColumnProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasksByStatus(status);

  // Flatten all pages into a single array of tasks
  const tasks: Task[] = (data as any)?.pages?.flatMap((page: PagedTaskList) => page.data) || [];
  const totalTasks = (data as any)?.pages?.[0]?.totalRecords || 0;

  // Make this column a drop zone
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: status,
  });

  // Infinite scroll implementation
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const lastTaskElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-x-hidden">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 truncate">{title}</h2>
        <div className="task-column-scroll flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-x-hidden">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 truncate">{title}</h2>
        <div className="task-column-scroll flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <p className="text-red-500">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
      <div 
        ref={setDroppableRef}
        data-column-status={status}
        className={`flex-1 min-h-96 flex flex-col lg:min-h-0 min-w-0 overflow-x-hidden transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
        }`}
      >
      <h2 className="mb-4 text-lg font-semibold text-gray-800 truncate">
        {title} ({tasks.length} of {totalTasks})
      </h2>
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5 min-w-0">
        {tasks.map((task: Task, index: number) => {
          const isLastTask = index === tasks.length - 1;
          return (
            <DraggableTask
              key={task.id}
              task={task}
              isLastTask={isLastTask}
              lastTaskElementRef={lastTaskElementRef}
            />
          );
        })}
        
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="text-gray-500 text-sm">Loading more tasks...</div>
          </div>
        )}
        
        {tasks.length === 0 && !isLoading && (
          <p className="text-gray-400 italic text-center mt-5">
            No tasks in this status
          </p>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    
    // Find the task being dragged from all columns
    // We'll need to search through all the data to find the task
    // For now, we'll set a placeholder and improve this later
    setActiveTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end - active:', active.id, 'over:', over?.id);
    
    if (!over) return;

    const taskId = active.id as string;
    let newStatus: TaskStatus | null = null;

    // Check if we're dropping directly on a column (status)
    if (over.id === TaskStatus.TODO || over.id === TaskStatus.IN_PROGRESS || over.id === TaskStatus.COMPLETED) {
      newStatus = over.id as TaskStatus;
      console.log('Dropped on column, new status:', newStatus);
    } else {
      // If dropping on a task, we need to find which column it belongs to
      // We'll determine this by checking which column contains the task
      console.log('Dropped on task, finding column...');
      
      // Find which column the dropped task belongs to
      // We need to check all the task data to find the column
      // For now, let's try a different approach - check the DOM element
      const overElement = document.querySelector(`[data-task-id="${over.id}"]`);
      if (overElement) {
        const columnElement = overElement.closest('[data-column-status]');
        if (columnElement) {
          const columnStatus = columnElement.getAttribute('data-column-status');
          if (columnStatus && (columnStatus === TaskStatus.TODO || columnStatus === TaskStatus.IN_PROGRESS || columnStatus === TaskStatus.COMPLETED)) {
            newStatus = columnStatus as TaskStatus;
            console.log('Found column from DOM, new status:', newStatus);
          }
        }
      }
      
      if (!newStatus) {
        console.log('Could not determine target column. Skipping update.');
        setActiveTask(null);
        return;
      }
    }

    // Update the task status
    if (newStatus) {
      console.log('Updating task', taskId, 'to status:', newStatus);
      updateTaskStatusMutation.mutate({
        taskId,
        status: newStatus,
      });
    }

    setActiveTask(null);
  };

  return (
    <div className="p-5 w-full max-w-full overflow-hidden">
      <style>
        {`
          .task-column-scroll::-webkit-scrollbar {
            display: none;
          }
          .task-column-scroll {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
        `}
      </style>
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Tasks</h1>
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-2.5 h-[calc(100vh-200px)] w-full max-w-full overflow-hidden overflow-x-hidden">
          <TaskColumn status={TaskStatus.TODO} title="To Do" />
          <TaskColumn status={TaskStatus.IN_PROGRESS} title="In Progress" />
          <TaskColumn status={TaskStatus.COMPLETED} title="Completed" />
        </div>
        
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
      </DndContext>
    </div>
  );
}
