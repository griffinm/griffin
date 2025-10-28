import { useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useInfiniteTasksByStatus } from '@/hooks/useTasks';
import { TaskStatus, Task, PagedTaskList } from '@/types/task';
import { DraggableTask } from './DraggableTask';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  searchTasks?: Task[];
  selectedPriorities?: string[];
}

export function TaskColumn({ status, title, searchTasks, selectedPriorities }: TaskColumnProps) {
  const isSearching = searchTasks !== undefined;
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasksByStatus([status]);
  
  const pages = (data as any)?.pages as PagedTaskList[] | undefined;
  const totalRecords = pages?.[0]?.totalRecords ?? 0;

  let tasks: Task[];
  if (isSearching) {
    tasks = searchTasks.filter(task => task.status === status);
  } else {
    tasks = pages?.flatMap((page: PagedTaskList) => page.data) || [];
  }
  
  if (selectedPriorities && selectedPriorities.length > 0) {
    tasks = tasks.filter(task => selectedPriorities.includes(task.priority));
  }

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: status,
  });

  // Infinite scroll implementation (disabled during search)
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const lastTaskElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isSearching || isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isSearching, isLoading, hasNextPage, fetchNextPage]);

  if (!isSearching && isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-x-hidden">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 truncate">{title}</h2>
        <div className="task-column-scroll flex-1 overflow-y-auto overflow-x-hidden min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSearching && error) {
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
        {title} <span className="text-gray-500 text-sm">({isSearching ? tasks.length : totalRecords})</span>
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
        
        {!isSearching && isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="text-gray-500 text-sm">Loading more tasks...</div>
          </div>
        )}
        
        {tasks.length === 0 && (isSearching || !isLoading) && (
          <p className="text-gray-400 italic text-center mt-5">
            {isSearching ? 'No matching tasks' : 'No tasks in this status'}
          </p>
        )}
      </div>
    </div>
  );
}
