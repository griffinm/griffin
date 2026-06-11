import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  fetchDataTable,
  createDataTable,
  cloneDataTable,
  updateDataTable,
  deleteDataTable,
  CreateDataTableData,
  CloneDataTableData,
  DataTablePatch,
} from '@/api/dataTablesApi';
import { DataTable } from '@/types/dataTable';

export const useDataTable = (id: string): UseQueryResult<DataTable, Error> => {
  return useQuery({
    queryKey: ['dataTable', id],
    queryFn: () => fetchDataTable(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDataTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDataTableData) => createDataTable(data),
    onSuccess: (table) => {
      queryClient.setQueryData(['dataTable', table.id], table);
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to create data table',
        color: 'red',
      });
    },
  });
};

export const useCloneDataTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CloneDataTableData) => cloneDataTable(data),
    onSuccess: (table) => {
      queryClient.setQueryData(['dataTable', table.id], table);
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy data table',
        color: 'red',
      });
    },
  });
};

export const useUpdateDataTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DataTablePatch }) =>
      updateDataTable(id, patch),
    // The editor keeps the ['dataTable', id] cache current optimistically and
    // PATCHes on a debounce, so a response must not overwrite the cache — it
    // could clobber edits made while the request was in flight. On error,
    // refetch to resync with the server.
    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dataTable', id] });
      notifications.show({
        title: 'Error',
        message: 'Failed to save data table',
        color: 'red',
      });
    },
  });
};

export const useDeleteDataTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDataTable(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['dataTable', id] });
    },
  });
};
