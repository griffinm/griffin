import { Note } from "@prisma/client";
import { AxiosResponse } from "axios";
import { baseClient } from "./baseClient";

export interface NoteUpdateProps {
  id: string,
  title?: string | null,
  content?: string | null,
  parentId?: string | null,
  notebookId?: string | null,
}

export const fetchRecentNotes = async(): Promise<AxiosResponse<Note[]>> => {
  return baseClient.get('/notes/recent');
}

export const fetchNote = async(
  noteId: string,
): Promise<AxiosResponse<Note>> => {
  return baseClient.get(`/notes/${noteId}`);
}

export const updateNote = async({
  id,
  title,
  content,
  notebookId,
}: NoteUpdateProps): Promise<AxiosResponse<Note>> => {
  return baseClient.patch(`/notes/${id}`, {
    content,
    title,
    notebookId,
  });
}

export const deleteNote = async(noteId: string): Promise<AxiosResponse<void>> => {
  return baseClient.delete(`/notes/${noteId}`);
}
