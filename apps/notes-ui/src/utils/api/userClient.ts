import { baseClient } from "./baseClient";
import { User } from "@prisma/client";
import { AxiosResponse } from "axios";

const urlBase = "/users";

export const fetchCurrentUser = async (): Promise<AxiosResponse<User>> => {
  const response = baseClient.get(`${urlBase}/current`);
  return response
}
