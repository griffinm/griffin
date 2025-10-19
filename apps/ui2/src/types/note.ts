export interface Note {
  id: string;
  title: string;
  content?: string;
  notebookId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteFilters {
  notebookId?: string;
  page?: number;
  resultsPerPage?: number;
  search?: string;
}

export interface PagedNoteList {
  page: number;
  resultsPerPage: number;
  totalPages: number;
  totalRecords: number;
  data: Note[];
}

