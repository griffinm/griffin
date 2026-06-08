import { baseClient } from "./baseClient";
import { Dropdown, DropdownInstance } from "@/types/dropdown";

// ---- Option input shapes -----------------------------------------------------

export interface DropdownOptionInput {
  label: string;
  color?: string;
  isDefault?: boolean;
  order?: number;
}

export interface CreateDropdownData {
  name: string;
  options?: DropdownOptionInput[];
}

// ---- Definitions -------------------------------------------------------------

export const fetchDropdowns = async (): Promise<Dropdown[]> => {
  const response = await baseClient.get<Dropdown[]>('/dropdowns');
  return response.data;
};

export const fetchDropdownById = async (id: string): Promise<Dropdown> => {
  const response = await baseClient.get<Dropdown>(`/dropdowns/${id}`);
  return response.data;
};

export const createDropdown = async (data: CreateDropdownData): Promise<Dropdown> => {
  const response = await baseClient.post<Dropdown>('/dropdowns', data);
  return response.data;
};

export const updateDropdown = async (
  id: string,
  data: { name: string },
): Promise<Dropdown> => {
  const response = await baseClient.patch<Dropdown>(`/dropdowns/${id}`, data);
  return response.data;
};

export const deleteDropdown = async (id: string): Promise<void> => {
  await baseClient.delete(`/dropdowns/${id}`);
};

// ---- Options -----------------------------------------------------------------

export const addDropdownOption = async (
  dropdownId: string,
  option: DropdownOptionInput,
): Promise<Dropdown> => {
  const response = await baseClient.post<Dropdown>(
    `/dropdowns/${dropdownId}/options`,
    option,
  );
  return response.data;
};

export const updateDropdownOption = async (
  dropdownId: string,
  optionId: string,
  option: Partial<DropdownOptionInput>,
): Promise<Dropdown> => {
  const response = await baseClient.patch<Dropdown>(
    `/dropdowns/${dropdownId}/options/${optionId}`,
    option,
  );
  return response.data;
};

export const deleteDropdownOption = async (
  dropdownId: string,
  optionId: string,
): Promise<Dropdown> => {
  const response = await baseClient.delete<Dropdown>(
    `/dropdowns/${dropdownId}/options/${optionId}`,
  );
  return response.data;
};

// ---- Instances ---------------------------------------------------------------

export const createDropdownInstance = async (data: {
  dropdownId: string;
  noteId: string;
}): Promise<DropdownInstance> => {
  const response = await baseClient.post<DropdownInstance>('/dropdown-instances', data);
  return response.data;
};

export const fetchDropdownInstance = async (id: string): Promise<DropdownInstance> => {
  const response = await baseClient.get<DropdownInstance>(`/dropdown-instances/${id}`);
  return response.data;
};

export const updateDropdownInstance = async (
  id: string,
  data: { selectedOptionId: string | null },
): Promise<DropdownInstance> => {
  const response = await baseClient.patch<DropdownInstance>(
    `/dropdown-instances/${id}`,
    data,
  );
  return response.data;
};
