import { baseClient } from "./baseClient";
import { SearchResults } from "@/types/search";

export interface SearchRequest {
  query: string;
  collection?: 'notes' | 'tasks' | 'all';
}

export const fetchSearchResults = async ({ query, collection = 'notes' }: SearchRequest): Promise<SearchResults> => {
  const response = await baseClient.get<SearchResults>(`/search?query=${query}&collection=${collection}`);
  return response.data;
};

