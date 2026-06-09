import { Input, MultiSelect } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { TaskPriority } from '@/types/task';
import { Tag } from '@/types/tag';

interface TasksFiltersProps {
  search: string;
  onSearchChange: (_value: string) => void;
  selectedPriorities: string[];
  onPrioritiesChange: (_priorities: string[]) => void;
  selectedTags: string[];
  onTagsChange: (_tags: string[]) => void;
  availableTags: Tag[];
}

export function TasksFilters({
  search,
  onSearchChange,
  selectedPriorities,
  onPrioritiesChange,
  selectedTags,
  onTagsChange,
  availableTags,
}: TasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--at-line)] pb-4">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tasks"
        leftSection={<IconSearch size={16} />}
        style={{ flex: '1 1 220px', minWidth: 0 }}
      />
      <MultiSelect
        placeholder="Priority"
        data={[
          { value: TaskPriority.HIGH, label: 'High' },
          { value: TaskPriority.MEDIUM, label: 'Medium' },
          { value: TaskPriority.LOW, label: 'Low' },
        ]}
        value={selectedPriorities}
        onChange={onPrioritiesChange}
        clearable
        style={{ flex: '1 1 160px' }}
      />
      <MultiSelect
        placeholder="Tags"
        data={availableTags.map((tag) => ({ value: tag.id, label: tag.name }))}
        value={selectedTags}
        onChange={onTagsChange}
        clearable
        searchable
        style={{ flex: '1 1 160px' }}
      />
    </div>
  );
}
