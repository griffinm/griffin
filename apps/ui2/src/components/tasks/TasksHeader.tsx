import { Button, SegmentedControl } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export type ViewMode = 'cols' | 'rows';

interface TasksHeaderProps {
  onCreateClick: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TasksHeader({ onCreateClick, viewMode, onViewModeChange }: TasksHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <Button 
        leftSection={<IconPlus size={18} />}
        onClick={onCreateClick}
      >
        Create Task
      </Button>
      <SegmentedControl
        value={viewMode}
        onChange={(value: string) => onViewModeChange(value as ViewMode)}
        data={[
          { label: 'Columns', value: 'cols' },
          { label: 'Rows', value: 'rows' },
        ]}
      />
    </div>
  );
}

