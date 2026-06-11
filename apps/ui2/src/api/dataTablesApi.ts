import { baseClient } from "./baseClient";
import {
  DataTable,
  DataTableColumn,
  DataTableFilter,
  DataTableRow,
  DataTableSort,
} from "@/types/dataTable";

export interface CreateDataTableData {
  noteId: string;
  columns?: DataTableColumn[];
  rows?: DataTableRow[];
}

export interface CloneDataTableData {
  noteId: string;
  sourceId: string;
}

export interface DataTablePatch {
  columns?: DataTableColumn[];
  rows?: DataTableRow[];
  /** null clears the sort; undefined leaves it unchanged. */
  sort?: DataTableSort | null;
  filters?: DataTableFilter[];
}

export const fetchDataTable = async (id: string): Promise<DataTable> => {
  const response = await baseClient.get<DataTable>(`/data-tables/${id}`);
  return response.data;
};

export const createDataTable = async (
  data: CreateDataTableData,
): Promise<DataTable> => {
  const response = await baseClient.post<DataTable>('/data-tables', data);
  return response.data;
};

export const cloneDataTable = async (
  data: CloneDataTableData,
): Promise<DataTable> => {
  const response = await baseClient.post<DataTable>('/data-tables/clone', data);
  return response.data;
};

export const updateDataTable = async (
  id: string,
  patch: DataTablePatch,
): Promise<DataTable> => {
  const response = await baseClient.patch<DataTable>(`/data-tables/${id}`, patch);
  return response.data;
};

export const deleteDataTable = async (id: string): Promise<void> => {
  await baseClient.delete(`/data-tables/${id}`);
};
