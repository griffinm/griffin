import { 
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData, 
} from '@tanstack/react-query';
import { fetchTasks,
  fetchTaskById,
  updateTaskStatus,
} from '@/api/tasksApi';
import {
  Task,
  PagedTaskList,
  TaskFilters,
  TaskStatus,
  SortBy,
  SortOrder,
} from '@/types/task';

export const useTasks = (filters?: TaskFilters): UseQueryResult<PagedTaskList, Error> => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTask = (id: string): UseQueryResult<Task, Error> => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTaskById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllTasks = (): UseQueryResult<Task[], Error> => {
  return useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const result = await fetchTasks({ resultsPerPage: 10000 }); // Get a large number
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTasksByStatus = (status: TaskStatus): UseQueryResult<Task[], Error> => {
  return useQuery({
    queryKey: ['tasks', 'byStatus', status],
    queryFn: async () => {
      const result = await fetchTasks({ 
        status, 
        resultsPerPage: 100 
      });
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useInfiniteTasksByStatus = (
  statuses: TaskStatus | TaskStatus[],
  additionalFilters?: Partial<TaskFilters>
): UseInfiniteQueryResult<PagedTaskList, Error> => {
  const statusArray = Array.isArray(statuses) ? statuses : [statuses];
  
  const primaryStatus = statusArray[0];
  const sortBy = primaryStatus === TaskStatus.COMPLETED ? SortBy.COMPLETED_AT : SortBy.DUE_DATE;
  const sortOrder = primaryStatus === TaskStatus.COMPLETED ? SortOrder.DESC : SortOrder.ASC;
  
  const statusParam = statusArray.join(',');
  
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', 'byStatus', statusArray, sortBy, sortOrder, additionalFilters],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchTasks({ 
        status: statusParam, 
        page: pageParam,
        resultsPerPage: 20,
        sortBy,
        sortOrder,
        ...additionalFilters,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for updating task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => 
      updateTaskStatus(taskId, status),
    
    onMutate: async ({ taskId, status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousData = new Map<string, InfiniteData<PagedTaskList, number>>();

      const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];

      let movedTask: Task | undefined;
      let oldStatus: TaskStatus | undefined;

      // Find the task in any of the infinite query caches
      statuses.forEach((status) => {
        // Get all query keys that match the infinite query pattern for this status
        queryClient.getQueriesData<InfiniteData<PagedTaskList, number>>({ 
          queryKey: ['tasks', 'infinite', 'byStatus'],
          exact: false 
        }).forEach(([queryKey, data]) => {
          // Check if this query is for the current status
          const statusArray = (queryKey as any[])[3];
          if (data && Array.isArray(statusArray) && statusArray.includes(status)) {
            const keyString = JSON.stringify(queryKey);
            previousData.set(keyString, data);

            if (!movedTask) {
              const pages = data.pages || [];
              for (const page of pages) {
                const task = page.data?.find((t: Task) => t.id === taskId);
                if (task) {
                  movedTask = task;
                  oldStatus = status;
                  break;
                }
              }
            }
          }
        });
      });

      if (movedTask && oldStatus !== undefined) {
        // Update the task with new status and completedAt if completing
        const updatedTask: Task = { 
          ...movedTask, 
          status: newStatus,
          completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : null,
        };

        // Update all relevant query caches
        queryClient.getQueriesData<InfiniteData<PagedTaskList, number>>({ 
          queryKey: ['tasks', 'infinite', 'byStatus'],
          exact: false 
        }).forEach(([queryKey, data]) => {
          if (!data) return;

          const statusArray = (queryKey as any[])[3] as TaskStatus[];
          const sortBy = (queryKey as any[])[4] as SortBy;
          const sortOrder = (queryKey as any[])[5] as SortOrder;

          // Remove from old status queries
          if (statusArray.includes(oldStatus)) {
            queryClient.setQueryData<InfiniteData<PagedTaskList, number>>(queryKey, {
              ...data,
              pages: data.pages.map((page: PagedTaskList) => ({
                ...page,
                data: page.data.filter((t: Task) => t.id !== taskId),
                totalRecords: Math.max(0, page.totalRecords - 1),
              })),
            });
          }

          // Add to new status queries
          if (statusArray.includes(newStatus)) {
            queryClient.setQueryData<InfiniteData<PagedTaskList, number>>(queryKey, (old) => {
              if (!old) {
                return {
                  pages: [{
                    data: [updatedTask],
                    page: 1,
                    resultsPerPage: 20,
                    totalPages: 1,
                    totalRecords: 1,
                  }],
                  pageParams: [1],
                };
              }

              // Insert task in sorted position within first page
              return {
                ...old,
                pages: old.pages.map((page: PagedTaskList, index: number) => {
                  if (index === 0) {
                    const newData = [...page.data];
                    
                    // Find correct position based on sort order
                    let insertIndex = 0;
                    if (sortBy === SortBy.COMPLETED_AT && sortOrder === SortOrder.DESC) {
                      // For completed tasks sorted by completedAt DESC, insert at beginning
                      insertIndex = 0;
                    } else if (sortBy === SortBy.DUE_DATE && sortOrder === SortOrder.ASC) {
                      // For other tasks sorted by dueDate ASC, find correct position
                      const newDueDate = updatedTask.dueDate;
                      if (newDueDate) {
                        insertIndex = newData.findIndex(t => {
                          return t.dueDate && new Date(t.dueDate) > new Date(newDueDate);
                        });
                        if (insertIndex === -1) insertIndex = newData.length;
                      } else {
                        // Tasks without due date go to the end
                        insertIndex = newData.length;
                      }
                    }

                    newData.splice(insertIndex, 0, updatedTask);

                    return {
                      ...page,
                      data: newData,
                      totalRecords: page.totalRecords + 1,
                    };
                  }
                  return page;
                }),
              };
            });
          }
        });
      }

      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        // Restore all previous query data
        context.previousData.forEach((data, keyString) => {
          const queryKey = JSON.parse(keyString);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
};
