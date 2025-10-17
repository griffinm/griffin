import { baseClient } from "./baseClient";
import { User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message?: string;
}

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await baseClient.get<User>('/users/current');
  return response.data;
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await baseClient.post<LoginResponse>('/auth/sign-in', credentials);
  return response.data;
}

export const logoutUser = async (): Promise<{ message: string }> => {
  const response = await baseClient.post<{ message: string }>('/auth/sign-out');
  return response.data;
}
