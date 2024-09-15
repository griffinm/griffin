import { baseClient } from "./baseClient";
import { Question } from "@prisma/client";
import { AxiosResponse } from "axios";

export interface CreateQuestionRequest {
  question: string;
  noteId: string;
}

export interface UpdateQuestionRequest {
  question: string;
  noteId: string;
  questionId: string;
  answer: string;
  deletedAt?: Date;
}

export const createQuestion = async ({
  question,
  noteId,
}: CreateQuestionRequest): Promise<AxiosResponse<Question>> => {
  const url = `notes/${noteId}/questions`;
  return baseClient.post(url, { question });
}

export const updateQuestion = async ({
  question,
  noteId,
  questionId,
  answer,
  deletedAt,
}: UpdateQuestionRequest): Promise<AxiosResponse<Question>> => {
  const url = `notes/${noteId}/questions/${questionId}`;
  return baseClient.patch(url, { question, answer, deletedAt });
}
