import { baseClient } from "./baseClient";
import { SearchResults } from "@/types/search";

export interface SearchRequest {
  query: string;
}

export const fetchSearchResults = async ({ query }: SearchRequest): Promise<SearchResults> => {
  const response = await baseClient.get<SearchResults>(`/search?query=${query}`);
  return response.data;
};

