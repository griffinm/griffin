import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { 
  fetchNotebooks, 
  fetchTopLevelNotebooks, 
  fetchNotebooksByParent, 
  fetchNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  CreateOrUpdateNotebookData
} from '@/api/notebooksApi';
import { Notebook } from '@/types/notebook';

export const useNotebooks = (): UseQueryResult<Notebook[], Error> => {
  return useQuery({
    queryKey: ['notebooks'],
    queryFn: () => fetchNotebooks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTopLevelNotebooks = (): UseQueryResult<Notebook[], Error> => {
  return useQuery({
    queryKey: ['notebooks', 'top-level'],
    queryFn: () => fetchTopLevelNotebooks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useNotebooksByParent = (parentNotebookId: string, enabled = true): UseQueryResult<Notebook[], Error> => {
  return useQuery({
    queryKey: ['notebooks', 'by-parent', parentNotebookId],
    queryFn: () => fetchNotebooksByParent(parentNotebookId),
    enabled: enabled && !!parentNotebookId, // Only run query if parentNotebookId is provided and enabled is true
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useNotebook = (id: string): UseQueryResult<Notebook, Error> => {
  return useQuery({
    queryKey: ['notebook', id],
    queryFn: () => fetchNotebookById(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Alias for useNotebooks for consistency
export const useAllNotebooks = (): UseQueryResult<Notebook[], Error> => {
  return useNotebooks();
};

// Hook for creating a notebook
export const useCreateNotebook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notebook: CreateOrUpdateNotebookData) => createNotebook(notebook),
    onSuccess: () => {
      // Invalidate all notebook queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

// Hook for updating a notebook
export const useUpdateNotebook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, notebook }: { id: string; notebook: CreateOrUpdateNotebookData }) => 
      updateNotebook(id, notebook),
    onSuccess: (_, variables) => {
      // Invalidate specific notebook and all notebook lists
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

// Hook for deleting a notebook
export const useDeleteNotebook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteNotebook(id),
    onSuccess: () => {
      // Invalidate all notebook queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

