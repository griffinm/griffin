import { PagedTaskList, Task, TaskStatus } from "@/types/task";
import { useInfiniteTasksByStatus, useTasks } from "@/hooks/useTasks";
import { TaskRow } from "./TaskRow";
import { useEffect, useRef } from "react";

export const TaskRows = ({
  setActiveTask,
  activeTask,
  searchTasks,
}: {
  setActiveTask: (task: Task | null) => void;
  activeTask: Task | null;
  searchTasks?: Task[];
}) => {
  // Check if we're in search mode
  const isSearching = searchTasks !== undefined;
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasksByStatus([TaskStatus.TODO, TaskStatus.IN_PROGRESS]);
  
  // Determine which tasks to display
  let tasks: Task[];
  if (isSearching) {
    // Use search results (rows view shows TODO and IN_PROGRESS)
    tasks = searchTasks.filter(task => 
      task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS
    );
  } else {
    // Flatten all pages into a single array of tasks from query
    tasks = (data as any)?.pages?.flatMap((page: PagedTaskList) => page.data) || [];
  }
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't set up observer when searching
    if (isSearching) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isSearching, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (!isSearching && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (!isSearching && error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive">Error loading tasks</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          setActiveTask={setActiveTask}
          activeTask={activeTask}
        />
      ))}
      
      {/* Intersection observer target for infinite scroll (hidden during search) */}
      {!isSearching && <div ref={observerTarget} className="h-4" />}
      
      {!isSearching && isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="text-muted-foreground text-sm">Loading more tasks...</div>
        </div>
      )}
    </div>
  )
}