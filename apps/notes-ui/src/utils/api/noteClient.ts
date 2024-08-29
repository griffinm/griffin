import { Note } from "@prisma/client";
import { AxiosResponse } from "axios";
import { baseClient } from "./baseClient";
import { SearchResult } from "@griffin/types";

export interface NoteUpdateProps {
  id: string,
  title?: string,
  content?: string,
  parentId?: string,
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
}: NoteUpdateProps): Promise<AxiosResponse<Note>> => {
  return baseClient.patch(`/notes/${id}`, {
    content,
    title,
  });
}

export const deleteNote = async(noteId: string): Promise<AxiosResponse<void>> => {
  return baseClient.delete(`/notes/${noteId}`);
}

export const searchNotes = async(query: string): Promise<AxiosResponse<SearchResult[]>> => {
  return baseClient.get(`/notes/search?query=${query}`);
}
