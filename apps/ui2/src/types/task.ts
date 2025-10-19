export interface TaskStatusHistory {
  id: string;
  taskId: string;
  status: TaskStatus;
  changedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  noteId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  statusHistory?: TaskStatusHistory[];
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum SortBy {
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
  COMPLETED_AT = 'completedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface TaskFilters {
  status?: TaskStatus;
  page?: number;
  resultsPerPage?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  search?: string;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
}

export interface PagedTaskList {
  page: number;
  resultsPerPage: number;
  totalPages: number;
  totalRecords: number;
  data: Task[];
}
