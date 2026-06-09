import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  fetchNotebookDefaultTags,
  addNotebookDefaultTag,
  removeNotebookDefaultTag,
} from '@/api/notebooksApi';
import { Tag } from '@/types/tag';

export const useNotebookDefaultTags = (notebookId: string): UseQueryResult<Tag[], Error> => {
  return useQuery({
    queryKey: ['notebook-default-tags', notebookId],
    queryFn: () => fetchNotebookDefaultTags(notebookId),
    enabled: !!notebookId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAddNotebookDefaultTag = (notebookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => addNotebookDefaultTag(notebookId, tagId),
    onSuccess: (tags) => {
      queryClient.setQueryData(['notebook-default-tags', notebookId], tags);
      // Notes were seeded with the tag — refetch any open note views.
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useRemoveNotebookDefaultTag = (notebookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => removeNotebookDefaultTag(notebookId, tagId),
    onSuccess: (tags) => {
      queryClient.setQueryData(['notebook-default-tags', notebookId], tags);
      // Notes may have been untagged — refetch any open note views.
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};
