import { Tag } from '@/types/tag';

export interface TagManagerProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

