export class NoteResult {
  id: string;
  title: string;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'content' | 'title';
}

export class SearchResultsDto {
  query: string;
  hits: number;
  noteResults?: NoteResult[];
}
