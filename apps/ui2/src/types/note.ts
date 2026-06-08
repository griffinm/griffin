import { Tag } from './tag';

export interface Note {
  id: string;
  title: string;
  content?: string;
  notebookId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  pinnedAt?: string | null;
  tags?: Tag[];
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

