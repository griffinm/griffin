import { IsArray, IsOptional } from "class-validator";

export interface NoteResult {
  id: string;
  title: string;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'content' | 'title',
}

export class SearchResultsDto {
  query: string;
  hits: number;

  @IsOptional()
  @IsArray()
  noteResults?: NoteResult[];
}
