export interface NoteResult {
  id: string;
  title: string;
  notebookId: string;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'content' | 'title';
}

export interface TaskResult {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: number;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'title' | 'description';
}

export interface QuestionResult {
  id: string;
  question: string;
  answer?: string;
  noteId: string;
  matchedTokens: string[];
  snippet?: string;
  matchedField?: 'question' | 'answer';
}

export interface SearchResults {
  query: string;
  hits: number;
  noteResults?: NoteResult[];
  taskResults?: TaskResult[];
  questionResults?: QuestionResult[];
}

