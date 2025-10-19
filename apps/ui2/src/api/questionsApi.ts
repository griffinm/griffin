import { baseClient } from "./baseClient";
import { Question } from "@/types/question";

export interface CreateQuestionData {
  question: string;
  noteId: string;
}

export interface UpdateQuestionData {
  question: string;
  answer?: string;
  deletedAt?: Date;
}

export const fetchQuestions = async (includeAnswered = false): Promise<Question[]> => {
  const response = await baseClient.get<Question[]>(`/questions?includeAnswered=${includeAnswered}`);
  return response.data;
};

export const createQuestion = async (noteId: string, data: CreateQuestionData): Promise<Question> => {
  const response = await baseClient.post<Question>(`/notes/${noteId}/questions`, {
    question: data.question
  });
  return response.data;
};

export const updateQuestion = async (noteId: string, questionId: string, data: UpdateQuestionData): Promise<Question> => {
  const response = await baseClient.patch<Question>(`/notes/${noteId}/questions/${questionId}`, data);
  return response.data;
};

