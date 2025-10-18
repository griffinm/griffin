import { useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useInfiniteTasksByStatus } from '@/hooks/useTasks';
import { TaskStatus, Task, PagedTaskList } from '@/types/task';
import { DraggableTask } from './DraggableTask';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
}

export function TaskColumn({ status, title }: TaskColumnProps) {
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
        <div className="task-column-scroll flex-1 overflow-y-auto overflow-x-hidden min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-x-hidden">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 truncate">{title}</h2>
        <div className="task-column-scroll flex-1 overflow-y-auto overflow-x-hidden min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
        {title}
      </h2>
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
