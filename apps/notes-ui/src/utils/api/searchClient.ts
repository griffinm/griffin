import { AxiosResponse } from "axios";
import { baseClient } from "./baseClient";
import { SearchResultsDto } from "@griffin/api/search/dto/search-results.dto";

export interface SearchRequest {
  query: string;
}

export const fetchSearchResults = async({
  query,
}: SearchRequest): Promise<AxiosResponse<SearchResultsDto>> => {
  return await baseClient.get(`/search?query=${query}`);
}
