import { Button, SegmentedControl } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export type ViewMode = 'cols' | 'rows';

interface TasksHeaderProps {
  onCreateClick: () => void;
  viewMode: ViewMode;
  onViewModeChange: (_mode: ViewMode) => void;
}

export function TasksHeader({ onCreateClick, viewMode, onViewModeChange }: TasksHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="font-display text-2xl font-medium leading-none text-[var(--mantine-color-text)]">Tasks</h1>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <SegmentedControl
          value={viewMode}
          onChange={(value: string) => onViewModeChange(value as ViewMode)}
          data={[
            { label: 'Columns', value: 'cols' },
            { label: 'Rows', value: 'rows' },
          ]}
        />
        <Button leftSection={<IconPlus size={18} />} onClick={onCreateClick}>
          Create task
        </Button>
      </div>
    </div>
  );
}
