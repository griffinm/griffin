import { baseClient } from "./baseClient";
import { Tag } from "@/types/tag";
import { Note } from "@/types/note";
import { Task } from "@/types/task";

export const searchTags = async (query?: string): Promise<Tag[]> => {
  const params = new URLSearchParams();
  
  if (query) {
    params.append('search', query);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/tags?${queryString}` : '/tags';
  
  const response = await baseClient.get<Tag[]>(url);
  return response.data;
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const response = await baseClient.post<Tag>('/tags', { name, color });
  return response.data;
};

export const updateTag = async (tagId: string, data: { name?: string; color?: string }): Promise<Tag> => {
  const response = await baseClient.patch<Tag>(`/tags/${tagId}`, data);
  return response.data;
};

export const deleteTag = async (tagId: string): Promise<Tag> => {
  const response = await baseClient.delete<Tag>(`/tags/${tagId}`);
  return response.data;
};

export const getTagObjects = async (
  tagIds: string[], 
  logicMode: 'OR' | 'AND' = 'OR'
): Promise<{ notes: Note[]; tasks: Task[] }> => {
  const params = new URLSearchParams();
  params.append('tagIds', tagIds.join(','));
  params.append('logicMode', logicMode);
  
  const response = await baseClient.get<{ notes: Note[]; tasks: Task[] }>(`/tags/objects?${params.toString()}`);
  return response.data;
};

