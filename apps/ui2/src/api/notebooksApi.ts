import { baseClient } from "./baseClient";
import { Notebook } from "@/types/notebook";

export const fetchNotebooks = async (): Promise<Notebook[]> => {
  const response = await baseClient.get<Notebook[]>('/notebooks');
  return response.data;
};

export const fetchTopLevelNotebooks = async (): Promise<Notebook[]> => {
  const allNotebooks = await fetchNotebooks();
  // Only return notebooks without a parent (parentId is null, undefined, or empty string)
  return allNotebooks.filter(notebook => !notebook.parentId);
};

export const fetchNotebooksByParent = async (parentNotebookId: string): Promise<Notebook[]> => {
  const allNotebooks = await fetchNotebooks();
  return allNotebooks.filter(notebook => notebook.parentId === parentNotebookId);
};

export const fetchNotebookById = async (id: string): Promise<Notebook> => {
  const response = await baseClient.get<Notebook>(`/notebooks/${id}`);
  return response.data;
};

export interface CreateOrUpdateNotebookData {
  title: string;
  description?: string;
  parentId?: string | null;
}

export const createNotebook = async (notebook: CreateOrUpdateNotebookData): Promise<Notebook> => {
  const response = await baseClient.post<Notebook>('/notebooks', notebook);
  return response.data;
};

export const updateNotebook = async (id: string, notebook: CreateOrUpdateNotebookData): Promise<Notebook> => {
  const response = await baseClient.patch<Notebook>(`/notebooks/${id}`, notebook);
  return response.data;
};

export const deleteNotebook = async (id: string): Promise<void> => {
  await baseClient.delete(`/notebooks/${id}`);
};

