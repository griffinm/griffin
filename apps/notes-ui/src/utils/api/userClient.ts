import { baseClient } from "./baseClient";
import { User } from "@prisma/client";
import { AxiosResponse } from "axios";
import { CreateUserResponse } from "@griffin/types";

const urlBase = "/users";

export const createUser = async(
  email: string,
  password: string,
  firstName: string
): Promise<AxiosResponse<CreateUserResponse>> => {
  const response = baseClient.post(urlBase, { email, password, firstName });
  return response;
}

export const fetchCurrentUser = async (): Promise<AxiosResponse<User>> => {
  const response = baseClient.get(`${urlBase}/current`);
  return response
}
