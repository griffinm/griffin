import { Note } from "@prisma/client";
import { AxiosResponse } from "axios";
import { baseClient } from "./baseClient";

export interface NoteUpdateProps {
  id: number,
  title?: string,
  content?: string,
}

export const fetchNote = async(
  noteId: number,
): Promise<AxiosResponse<Note>> => {
  return baseClient.get(`/notes/${noteId}`);
}

export const updateNote = async({
  id,
  title,
  content,
}: NoteUpdateProps): Promise<AxiosResponse<Note>> => {
  return baseClient.patch(`/notes/${id}`, {
    content,
    title,
  });
}

export const deleteNote = async(noteId: number): Promise<AxiosResponse<void>> => {
  return baseClient.delete(`/notes/${noteId}`);
}
