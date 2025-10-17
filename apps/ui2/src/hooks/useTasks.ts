import { useQuery, useInfiniteQuery, useMutation, useQueryClient, UseQueryResult, UseInfiniteQueryResult } from '@tanstack/react-query';
import { fetchTasks, fetchTaskById, updateTaskStatus } from '@/api/tasksApi';
import { Task, PagedTaskList, TaskFilters, TaskStatus } from '@/types/task';

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
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting all tasks without pagination (useful for simple lists)
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

// Hook for loading tasks by status (for column view)
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

// Hook for infinite scroll tasks by status
export const useInfiniteTasksByStatus = (status: TaskStatus): UseInfiniteQueryResult<PagedTaskList, Error> => {
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', 'byStatus', status],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchTasks({ 
        status, 
        page: pageParam,
        resultsPerPage: 20 
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
    onSuccess: () => {
      // Invalidate all task queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
