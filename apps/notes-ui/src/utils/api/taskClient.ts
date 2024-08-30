import { Task } from "@prisma/client";
import { baseClient } from "./baseClient";
import { AxiosResponse } from "axios";
import { CreateOrUpdateTaskProps } from "./types";

export const searchTasks = async(
  filter: Partial<Task>,
): Promise<AxiosResponse<Task[]>> => {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    const valueString = value ? value.toString() : 'null';
    params.append(key, valueString);
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
  page?: number,
  resultsPerPage?: number,
): Promise<AxiosResponse<Task[]>> => {
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
