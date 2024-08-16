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
  console.log(filter);
  return baseClient.get(`/tasks?${params.toString()}`);
}

export const fetchTask = async(
  taskId: string,
): Promise<AxiosResponse<Task>> => {
  return baseClient.get(`/tasks/${taskId}`);
}

export const fetchAllTasks = async(
): Promise<AxiosResponse<Task[]>> => {
  return baseClient.get(`/tasks`);
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