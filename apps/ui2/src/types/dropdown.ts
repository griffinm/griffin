export interface DropdownOption {
  id: string;
  dropdownId: string;
  label: string;
  /**
   * Mantine color token (e.g. "blue", "gray") for the option's color scheme;
   * drives both the pill background and text.
   */
  color: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dropdown {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  options: DropdownOption[];
}

export interface DropdownInstance {
  id: string;
  dropdownId: string;
  noteId: string;
  /** null means "no explicit choice" — render the dropdown's default option. */
  selectedOptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
