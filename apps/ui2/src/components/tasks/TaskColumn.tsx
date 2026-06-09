import { useRef, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useInfiniteTasksByStatus } from '@/hooks/useTasks';
import { TaskStatus, Task, PagedTaskList, TaskFilters } from '@/types/task';
import { DraggableTask } from './DraggableTask';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  searchTasks?: Task[];
  selectedPriorities?: string[];
  selectedTags?: string[];
  /** Mobile pager: render plain (non-draggable) cards with an inline status control. */
  mobile?: boolean;
  /** Hide the column's own header (mobile pager shows the title instead). */
  hideHeader?: boolean;
}

export function TaskColumn({
  status,
  title,
  searchTasks,
  selectedPriorities,
  selectedTags,
  mobile = false,
  hideHeader = false,
}: TaskColumnProps) {
  const isSearching = searchTasks !== undefined;

  // Build filters for API
  const filters: Partial<TaskFilters> = {};
  if (selectedPriorities && selectedPriorities.length > 0) {
    filters.priority = selectedPriorities[0] as any; // For now, only support single priority
  }
  if (selectedTags && selectedTags.length > 0) {
    filters.tags = selectedTags.join(',');
  }

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasksByStatus([status], Object.keys(filters).length > 0 ? filters : undefined);

  const pages = (data as any)?.pages as PagedTaskList[] | undefined;
  const totalRecords = pages?.[0]?.totalRecords ?? 0;

  let tasks: Task[];
  if (isSearching) {
    tasks = searchTasks.filter((task) => task.status === status);
  } else {
    tasks = pages?.flatMap((page: PagedTaskList) => page.data) || [];
  }

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: status });

  // Infinite scroll implementation (disabled during search)
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const lastTaskElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = undefined;
      }
      if (isSearching || isLoading) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isSearching, isLoading, hasNextPage, fetchNextPage],
  );

  useEffect(() => {
    if (isSearching && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = undefined;
    }
  }, [isSearching]);

  const count = isSearching ? tasks.length : totalRecords;

  const header = !hideHeader && (
    <div className="mb-3 flex shrink-0 items-baseline justify-between border-b border-[var(--at-line)] pb-2">
      <h2 className="font-display text-base font-medium text-[var(--mantine-color-text)]">{title}</h2>
      <span className="task-meta text-[11px] text-[var(--mantine-color-dimmed)]">{count}</span>
    </div>
  );

  const rootClass = `flex min-w-0 flex-col overflow-x-hidden transition-colors ${
    mobile ? 'h-full' : 'min-h-0 flex-1'
  }`;
  const listClass =
    'task-column-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden min-w-0 pr-0.5 pb-2';

  if (!isSearching && (isLoading || error)) {
    return (
      <div className={rootClass}>
        {header}
        <div className={listClass}>
          {isLoading ? (
            <p className="text-sm text-[var(--mantine-color-dimmed)]">Loading…</p>
          ) : (
            <p className="text-sm text-red-500">Error: {error?.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mobile ? undefined : setDroppableRef}
      data-column-status={status}
      className={rootClass}
      style={mobile || !isOver ? undefined : { boxShadow: 'inset 0 0 0 1.5px var(--at-accent)', borderRadius: 12 }}
    >
      {header}
      <div className={listClass}>
        {tasks.map((task: Task, index: number) => {
          const isLast = index === tasks.length - 1;
          if (mobile) {
            return (
              <div key={task.id} ref={isLast ? lastTaskElementRef : undefined}>
                <TaskCard task={task} showStatusControl />
              </div>
            );
          }
          return (
            <DraggableTask
              key={task.id}
              task={task}
              isLastTask={isLast}
              lastTaskElementRef={lastTaskElementRef}
            />
          );
        })}

        {!isSearching && isFetchingNextPage && (
          <div className="py-3 text-center text-sm text-[var(--mantine-color-dimmed)]">Loading more…</div>
        )}

        {tasks.length === 0 && (isSearching || !isLoading) && (
          <p className="mt-6 text-center text-sm italic text-[var(--mantine-color-dimmed)]">
            {isSearching ? 'No matching tasks' : 'Nothing here yet'}
          </p>
        )}
      </div>
    </div>
  );
}
