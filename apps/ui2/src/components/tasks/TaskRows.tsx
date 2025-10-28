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
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasksByStatus([TaskStatus.TODO, TaskStatus.IN_PROGRESS]);
  let tasks: Task[] = (data as any)?.pages?.flatMap((page: PagedTaskList) => page.data) || [];
  
  // If searching, use only search results (rows view shows TODO and IN_PROGRESS)
  if (searchTasks && searchTasks.length > 0) {
    tasks = searchTasks.filter(task => 
      task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS
    );
  }
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
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
      
      {/* Intersection observer target for infinite scroll */}
      <div ref={observerTarget} className="h-4" />
      
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="text-muted-foreground text-sm">Loading more tasks...</div>
        </div>
      )}
    </div>
  )
}