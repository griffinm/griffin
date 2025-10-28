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

export const useInfiniteTasksByStatus = (statuses: TaskStatus | TaskStatus[]): UseInfiniteQueryResult<PagedTaskList, Error> => {
  const statusArray = Array.isArray(statuses) ? statuses : [statuses];
  
  const primaryStatus = statusArray[0];
  const sortBy = primaryStatus === TaskStatus.COMPLETED ? SortBy.COMPLETED_AT : SortBy.DUE_DATE;
  const sortOrder = primaryStatus === TaskStatus.COMPLETED ? SortOrder.DESC : SortOrder.ASC;
  
  const statusParam = statusArray.join(',');
  
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', 'byStatus', statusArray, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchTasks({ 
        status: statusParam, 
        page: pageParam,
        resultsPerPage: 20,
        sortBy,
        sortOrder,
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

      const previousData = {
        byStatus: {} as Record<TaskStatus, InfiniteData<PagedTaskList, number>>,
      };

      const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];

      let movedTask: Task | undefined;
      let oldStatus: TaskStatus | undefined;

      statuses.forEach((status) => {
        const queryKey = ['tasks', 'byStatus', status];
        const data = queryClient.getQueryData<InfiniteData<PagedTaskList, number>>(queryKey);
        
        if (data) {
          previousData.byStatus[status] = data;

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
      });

      if (movedTask && oldStatus !== undefined) {
        const oldQueryKey = ['tasks', 'byStatus', oldStatus];
        queryClient.setQueryData<InfiniteData<PagedTaskList, number>>(oldQueryKey, (old) => {
          if (!old) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: PagedTaskList) => ({
              ...page,
              data: page.data.filter((t: Task) => t.id !== taskId),
              totalRecords: page.totalRecords - 1,
            })),
          };
        });

        // Add task to new status column with updated status
        const newQueryKey = ['tasks', 'byStatus', newStatus];
        const updatedTask = { ...movedTask, status: newStatus };
        
        queryClient.setQueryData<InfiniteData<PagedTaskList, number>>(newQueryKey, (old) => {
          if (!old) {
            // If there's no data for this status yet, create a new structure
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
          
          return {
            ...old,
            pages: old.pages.map((page: PagedTaskList, index: number) => {
              // Add to the first page
              if (index === 0) {
                return {
                  ...page,
                  data: [updatedTask, ...page.data],
                  totalRecords: page.totalRecords + 1,
                };
              }
              return page;
            }),
          };
        });
      }

      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        Object.entries(context.previousData.byStatus).forEach(([status, data]) => {
          const queryKey = ['tasks', 'byStatus', status as TaskStatus];
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
