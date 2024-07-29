import { baseClient } from "./baseClient";
import { Note, Notebook } from "@prisma/client";
import { AxiosResponse } from "axios";

const urlBase = "/notebooks";

export const fetchNotebooks = async (): Promise<AxiosResponse<Notebook[]>> => {
  return baseClient.get(`${urlBase}`);
}

export const fetchNotesForNotebook = async (
  notebookId: number,
): Promise<AxiosResponse<Note[]>> => {
  return baseClient.get(`${urlBase}/${notebookId}/notes`);
}

export const updateNotebook = async (
  notebookId: number,
  data: Notebook,
): Promise<AxiosResponse<Notebook>> => {
  return baseClient.patch(`${urlBase}/${notebookId}`, data);
}

export const createNotebook = async (
  title: string,
): Promise<AxiosResponse<Notebook>> => {
  const body = {
    title,
  }
  return baseClient.post(`${urlBase}`, body);
}

export const deleteNotebook = async (
  notebookId: number,
): Promise<AxiosResponse<Notebook>> => {
  return baseClient.delete(`${urlBase}/${notebookId}`);
}

export const createNote = async (
  notebookId: number,
): Promise<AxiosResponse<Note>> => {
  const body = {
    title: "New Note",
    content: "",
  }
  return baseClient.post(`${urlBase}/${notebookId}/notes`, body);
}
