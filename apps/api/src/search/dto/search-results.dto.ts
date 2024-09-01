import { IsArray, IsOptional } from "class-validator";

export interface NoteResult {
  id: string;
  title: string;
  matchedTokens: string[];
  snippet?: string;
}

export class SearchResultsDto {
  query: string;
  hits: number;

  @IsOptional()
  @IsArray()
  results?: NoteResult[];
}
