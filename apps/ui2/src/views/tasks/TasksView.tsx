import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '@/types/task';
import { TaskModal } from '@/components/tasks';
import { Button, SegmentedControl } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { TaskCols } from '@/components/tasks/TaskCols';
import { TaskRows } from '@/components/tasks/TaskRows';

type ViewMode = 'cols' | 'rows';

export function TasksView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cols');

  // Check for create=true query parameter on mount
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
      // Remove the query parameter after opening the modal
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="p-5 w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <Button 
          leftSection={<IconPlus size={18} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Task
        </Button>
        <SegmentedControl
          value={viewMode}
          onChange={(value: string) => setViewMode(value as ViewMode)}
          data={[
            { label: 'Columns', value: 'cols' },
            { label: 'Rows', value: 'rows' },
          ]}
        />
      </div>
      
      {viewMode === 'cols' && (
        <TaskCols 
          setActiveTask={setActiveTask}
          activeTask={activeTask}
        />
      )}
      
      {viewMode === 'rows' && (
        <TaskRows
          setActiveTask={setActiveTask}
          activeTask={activeTask}
        />
      )}

      <TaskModal 
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
