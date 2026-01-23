import { baseClient } from "./baseClient";
import { SearchResults } from "@/types/search";

export interface SearchRequest {
  query: string;
  collection?: 'notes' | 'tasks' | 'questions' | 'all';
  notebookId?: string;
}

export const fetchSearchResults = async ({ query, collection = 'notes', notebookId }: SearchRequest): Promise<SearchResults> => {
  let url = `/search?query=${encodeURIComponent(query)}&collection=${collection}`;
  if (notebookId) {
    url += `&notebookId=${notebookId}`;
  }
  const response = await baseClient.get<SearchResults>(url);
  return response.data;
};

