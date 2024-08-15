import { baseClient } from "./baseClient";
import { AxiosResponse } from "axios";
import { SignInResponse } from "@griffin/types";

const urlBase = "/auth";

export const signIn = async (
  email: string,
  password: string
): Promise<AxiosResponse<SignInResponse>> => {
  const response = baseClient.post(`${urlBase}/sign-in`, { email, password });
  return response;
}