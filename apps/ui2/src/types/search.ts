export interface NoteResult {
  id: string;
  title: string;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'content' | 'title';
}

export interface SearchResults {
  query: string;
  hits: number;
  noteResults?: NoteResult[];
}

