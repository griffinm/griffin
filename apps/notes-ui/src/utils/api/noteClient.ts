import { Note } from "@prisma/client";
import { AxiosResponse } from "axios";
import { baseClient } from "./baseClient";

export const fetchNote = async(
  noteId: number,
): Promise<AxiosResponse<Note>> => {
  return baseClient.get(`/notes/${noteId}`);
}

export const updateNote = async(note: Note): Promise<AxiosResponse<Note>> => {
  return baseClient.patch(`/notes/${note.id}`, {
    content: note.content,
    title: note.title,
  });
}

export const deleteNote = async(noteId: number): Promise<AxiosResponse<void>> => {
  return baseClient.delete(`/notes/${noteId}`);
}
