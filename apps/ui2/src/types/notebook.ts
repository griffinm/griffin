import { SortOrder } from './task';

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description?: string;
  parentId?: string | null;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookFilters {
  parentId?: string | null;
  page?: number;
  resultsPerPage?: number;
  sortBy?: NotebookSortBy;
  sortOrder?: SortOrder;
  search?: string;
}

export enum NotebookSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export interface PagedNotebookList {
  page: number;
  resultsPerPage: number;
  totalPages: number;
  totalRecords: number;
  data: Notebook[];
}

