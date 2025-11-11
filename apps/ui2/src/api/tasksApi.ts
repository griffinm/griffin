import { baseClient } from "./baseClient";
import { Task, PagedTaskList, TaskFilters } from "@/types/task";
import { Tag } from "@/types/tag";

export const fetchTasks = async (filters?: TaskFilters): Promise<PagedTaskList> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const queryString = params.toString();
  const url = queryString ? `/tasks?${queryString}` : '/tasks';
  
  const response = await baseClient.get<PagedTaskList>(url);
  return response.data;
};

export const fetchTaskById = async (id: string): Promise<Task> => {
  const response = await baseClient.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const updateTaskStatus = async (id: string, status: string): Promise<Task> => {
  const response = await baseClient.patch<Task>(`/tasks/${id}`, { status });
  return response.data;
};

export interface CreateOrUpdateTaskData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: string;
  status?: string;
}

export const createTask = async (task: CreateOrUpdateTaskData): Promise<Task> => {
  const response = await baseClient.post<Task>('/tasks', task);
  return response.data;
};

export const updateTask = async (id: string, task: CreateOrUpdateTaskData): Promise<Task> => {
  const response = await baseClient.patch<Task>(`/tasks/${id}`, task);
  return response.data;
};

export const addTagToTask = async (taskId: string, tagName: string): Promise<Tag> => {
  const response = await baseClient.post<Tag>(`/tasks/${taskId}/tags`, { name: tagName });
  return response.data;
};

export const removeTagFromTask = async (taskId: string, tagId: string): Promise<void> => {
  await baseClient.delete(`/tasks/${taskId}/tags/${tagId}`);
};

export const deleteTask = async (id: string): Promise<void> => {
  await baseClient.delete(`/tasks/${id}`);
};
