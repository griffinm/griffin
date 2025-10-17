import { baseClient } from "./baseClient";
import { Task, PagedTaskList, TaskFilters } from "@/types/task";

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
