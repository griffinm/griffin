import { baseClient } from "./baseClient";
import { User } from "@prisma/client";
import { AxiosResponse } from "axios";

const urlBase = "/users";

export const createUser = async(
  email: string,
  password: string
): Promise<AxiosResponse<User>> => {
  const response = baseClient.post(urlBase, { email, password });
  return response;
}

export const fetchCurrentUser = async (): Promise<AxiosResponse<User>> => {
  const response = baseClient.get(`${urlBase}/current`);
  return response
}
