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
