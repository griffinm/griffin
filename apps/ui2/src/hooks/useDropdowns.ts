import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  fetchDropdowns,
  fetchDropdownById,
  createDropdown,
  updateDropdown,
  deleteDropdown,
  addDropdownOption,
  updateDropdownOption,
  deleteDropdownOption,
  createDropdownInstance,
  fetchDropdownInstance,
  updateDropdownInstance,
  CreateDropdownData,
  DropdownOptionInput,
} from '@/api/dropdownsApi';
import { Dropdown, DropdownInstance } from '@/types/dropdown';

// ---- Queries -----------------------------------------------------------------

export const useDropdowns = (): UseQueryResult<Dropdown[], Error> => {
  return useQuery({
    queryKey: ['dropdowns'],
    queryFn: () => fetchDropdowns(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDropdown = (id: string): UseQueryResult<Dropdown, Error> => {
  return useQuery({
    queryKey: ['dropdown', id],
    queryFn: () => fetchDropdownById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDropdownInstance = (
  id: string,
): UseQueryResult<DropdownInstance, Error> => {
  return useQuery({
    queryKey: ['dropdownInstance', id],
    queryFn: () => fetchDropdownInstance(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ---- Definition mutations ----------------------------------------------------

export const useCreateDropdown = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDropdownData) => createDropdown(data),
    onSuccess: (dropdown) => {
      queryClient.invalidateQueries({ queryKey: ['dropdowns'] });
      queryClient.setQueryData(['dropdown', dropdown.id], dropdown);
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to create dropdown',
        color: 'red',
      });
    },
  });
};

export const useUpdateDropdown = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateDropdown(id, { name }),
    onSuccess: (dropdown) => {
      queryClient.invalidateQueries({ queryKey: ['dropdowns'] });
      queryClient.setQueryData(['dropdown', dropdown.id], dropdown);
    },
  });
};

export const useDeleteDropdown = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDropdown(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dropdowns'] });
      queryClient.removeQueries({ queryKey: ['dropdown', id] });
      notifications.show({
        title: 'Success',
        message: 'Dropdown deleted',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete dropdown',
        color: 'red',
      });
    },
  });
};

// ---- Option mutations (each returns the full updated Dropdown) ---------------

const cacheDropdown = (
  queryClient: ReturnType<typeof useQueryClient>,
  dropdown: Dropdown,
) => {
  queryClient.setQueryData(['dropdown', dropdown.id], dropdown);
  queryClient.invalidateQueries({ queryKey: ['dropdowns'] });
};

export const useAddDropdownOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dropdownId,
      option,
    }: {
      dropdownId: string;
      option: DropdownOptionInput;
    }) => addDropdownOption(dropdownId, option),
    onSuccess: (dropdown) => cacheDropdown(queryClient, dropdown),
  });
};

export const useUpdateDropdownOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dropdownId,
      optionId,
      option,
    }: {
      dropdownId: string;
      optionId: string;
      option: Partial<DropdownOptionInput>;
    }) => updateDropdownOption(dropdownId, optionId, option),
    onSuccess: (dropdown) => cacheDropdown(queryClient, dropdown),
  });
};

export const useDeleteDropdownOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dropdownId, optionId }: { dropdownId: string; optionId: string }) =>
      deleteDropdownOption(dropdownId, optionId),
    onSuccess: (dropdown) => cacheDropdown(queryClient, dropdown),
  });
};

// ---- Instance mutations ------------------------------------------------------

export const useCreateDropdownInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { dropdownId: string; noteId: string }) =>
      createDropdownInstance(data),
    onSuccess: (instance) => {
      queryClient.setQueryData(['dropdownInstance', instance.id], instance);
    },
  });
};

export const useUpdateDropdownInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      selectedOptionId,
    }: {
      id: string;
      selectedOptionId: string | null;
    }) => updateDropdownInstance(id, { selectedOptionId }),
    onSuccess: (instance) => {
      queryClient.setQueryData(['dropdownInstance', instance.id], instance);
    },
  });
};
