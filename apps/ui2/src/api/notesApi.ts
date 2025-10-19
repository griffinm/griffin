import { baseClient } from "./baseClient";
import { Note } from "@/types/note";

export const fetchNotesByNotebook = async (notebookId: string): Promise<Note[]> => {
  const response = await baseClient.get<Note[]>(`/notebooks/${notebookId}/notes`);
  return response.data;
};

export const fetchNoteById = async (id: string): Promise<Note> => {
  const response = await baseClient.get<Note>(`/notes/${id}`);
  return response.data;
};

export interface CreateOrUpdateNoteData {
  title: string;
  content?: string;
}

export const createNote = async (notebookId: string, note: CreateOrUpdateNoteData): Promise<Note> => {
  const response = await baseClient.post<Note>(`/notebooks/${notebookId}/notes`, note);
  return response.data;
};

export const updateNote = async (id: string, note: CreateOrUpdateNoteData): Promise<Note> => {
  const response = await baseClient.patch<Note>(`/notes/${id}`, note);
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await baseClient.delete(`/notes/${id}`);
};

