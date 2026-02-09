import { Input, MultiSelect } from '@mantine/core';
import { TaskPriority } from '@/types/task';
import { Tag } from '@/types/tag';

interface TasksFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPriorities: string[];
  onPrioritiesChange: (priorities: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
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
    <div className="flex gap-3 items-center border-b border-[var(--mantine-color-gray-3)] pb-4">
      <div>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks"
          style={{ flex: 1 }}
        />
      </div>
      <div>
        <MultiSelect
          placeholder="Filter by priority"
          data={[
            { value: TaskPriority.HIGH, label: 'High' },
            { value: TaskPriority.MEDIUM, label: 'Medium' },
            { value: TaskPriority.LOW, label: 'Low' },
          ]}
          value={selectedPriorities}
          onChange={onPrioritiesChange}
          clearable
          style={{ minWidth: 200 }}
        />
      </div>
      <div>
        <MultiSelect
          placeholder="Filter by tags"
          data={availableTags.map(tag => ({
            value: tag.id,
            label: tag.name,
          }))}
          value={selectedTags}
          onChange={onTagsChange}
          clearable
          style={{ minWidth: 200 }}
        />
      </div>
    </div>
  );
}

