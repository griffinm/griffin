import { Task } from "@prisma/client";
import { baseClient } from "./baseClient";
import { AxiosResponse } from "axios";
import { CreateOrUpdateTaskProps } from "./types";
import { PriorityOptionType, CompletedFilterOptions } from "@griffin/types";

export interface FetchTasksProps {
  completed?: CompletedFilterOptions;
  page?: number;
  resultsPerPage?: number;
  sortBy?: 'dueDate' | 'createdAt';
  search?: string;
  priority?: PriorityOptionType;
  startDate?: string;
  endDate?: string;
}

export interface TaskListResponse {
  data: Task[];
  page: number;
  resultsPerPage: number;
  totalPages: number;
  totalRecords: number;
}

export const searchTasks = async({
  page,
  resultsPerPage,
  sortBy,
  search,
  priority,
  completed,
  startDate,
  endDate,
}: FetchTasksProps): Promise<AxiosResponse<TaskListResponse>> => {
  const params = new URLSearchParams();

  Object.entries({
    page,
    resultsPerPage,
    sortBy,
    search,
    priority,
    completed,
    startDate,
    endDate,
  }).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  return baseClient.get(`/tasks?${params.toString()}`);
}

export const fetchTask = async(
  taskId: string,
): Promise<AxiosResponse<Task>> => {
  const params = new URLSearchParams();
  return baseClient.get(`/tasks/${taskId}?${params.toString()}`);
}

export const fetchAllTasks = async(
  page: number = 1,
  resultsPerPage: number = 50,
): Promise<AxiosResponse<TaskListResponse>> => {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (resultsPerPage) params.append('resultsPerPage', resultsPerPage.toString());
  return baseClient.get(`/tasks?${params.toString()}`);
}

export const updateTask = async(
  taskId: string,
  task: CreateOrUpdateTaskProps,
): Promise<AxiosResponse<Task>> => {
  return baseClient.patch(`/tasks/${taskId}`, task);
}

export const deleteTask = async(
  taskId: string,
): Promise<AxiosResponse<void>> => {
  return baseClient.delete(`/tasks/${taskId}`);
}

export const createTask = async(
  task: CreateOrUpdateTaskProps,
): Promise<AxiosResponse<Task>> => {
  return baseClient.post(`/tasks`, task);
}
