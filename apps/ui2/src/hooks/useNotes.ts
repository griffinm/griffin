import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { fetchNotesByNotebook, fetchNoteById, createNote, updateNote, deleteNote, fetchRecentNotes, CreateOrUpdateNoteData } from '@/api/notesApi';
import { Note } from '@/types/note';
import { notifications } from '@mantine/notifications';

// Hook for fetching notes by notebook ID
export const useNotesByNotebook = (notebookId: string): UseQueryResult<Note[], Error> => {
  return useQuery({
    queryKey: ['notes', 'byNotebook', notebookId],
    queryFn: () => fetchNotesByNotebook(notebookId),
    enabled: !!notebookId, // Only run query if notebookId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching a single note by ID
export const useNote = (id: string): UseQueryResult<Note, Error> => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => fetchNoteById(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a note
export const useCreateNote = (): UseMutationResult<Note, Error, { notebookId: string; note: CreateOrUpdateNoteData }, unknown> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ notebookId, note }: { notebookId: string; note: CreateOrUpdateNoteData }) => 
      createNote(notebookId, note),
    
    onSuccess: (data, variables) => {
      // Invalidate the notes list for this notebook
      queryClient.invalidateQueries({ queryKey: ['notes', 'byNotebook', variables.notebookId] });
      // Also invalidate all notes queries to be safe
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// Hook for updating a note
export const useUpdateNote = (): UseMutationResult<Note, Error, { id: string; note: CreateOrUpdateNoteData }, unknown> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: CreateOrUpdateNoteData }) => 
      updateNote(id, note),
    
    onSuccess: (data) => {
      // Invalidate the specific note
      queryClient.invalidateQueries({ queryKey: ['note', data.id] });
      // Invalidate the notes list for this notebook
      queryClient.invalidateQueries({ queryKey: ['notes', 'byNotebook', data.notebookId] });
      // Also invalidate all notes queries
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// Hook for deleting a note
export const useDeleteNote = (): UseMutationResult<void, Error, { id: string; notebookId: string }, unknown> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string; notebookId: string }) => 
      deleteNote(id),
    
    onSuccess: (_, variables) => {
      // Invalidate the specific note
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
      // Invalidate the notes list for this notebook
      queryClient.invalidateQueries({ queryKey: ['notes', 'byNotebook', variables.notebookId] });
      // Also invalidate all notes queries
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      // Show success notification
      notifications.show({
        title: 'Success',
        message: 'Note deleted successfully',
        color: 'green',
      });
    },
    onError: () => {
      // Show error notification
      notifications.show({
        title: 'Error',
        message: 'Failed to delete note',
        color: 'red',
      });
    },
  });
};

// Hook for fetching recent notes
export const useRecentNotes = (limit = 5): UseQueryResult<Note[], Error> => {
  return useQuery({
    queryKey: ['notes', 'recent', limit],
    queryFn: () => fetchRecentNotes(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

