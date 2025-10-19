import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { fetchQuestions, createQuestion, updateQuestion, CreateQuestionData, UpdateQuestionData } from '@/api/questionsApi';
import { Question } from '@/types/question';

// Hook for fetching all questions
export const useQuestions = (includeAnswered = false): UseQueryResult<Question[], Error> => {
  return useQuery({
    queryKey: ['questions', includeAnswered],
    queryFn: () => fetchQuestions(includeAnswered),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a question
export const useCreateQuestion = (): UseMutationResult<Question, Error, { noteId: string; data: CreateQuestionData }, unknown> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: CreateQuestionData }) => 
      createQuestion(noteId, data),
    
    onSuccess: () => {
      // Invalidate questions queries
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

// Hook for updating a question
export const useUpdateQuestion = (): UseMutationResult<Question, Error, { noteId: string; questionId: string; data: UpdateQuestionData }, unknown> => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ noteId, questionId, data }: { noteId: string; questionId: string; data: UpdateQuestionData }) => 
      updateQuestion(noteId, questionId, data),
    
    onSuccess: () => {
      // Invalidate questions queries
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

