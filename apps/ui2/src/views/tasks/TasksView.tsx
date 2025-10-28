import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '@/types/task';
import { TaskModal } from '@/components/tasks';
import { Button, Input, SegmentedControl } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { TaskCols } from '@/components/tasks/TaskCols';
import { TaskRows } from '@/components/tasks/TaskRows';
import { fetchSearchResults } from '@/api/searchApi';
import { SearchResults } from '@/types/search';

type ViewMode = 'cols' | 'rows';

const SEARCH_TIMEOUT = 300;

export function TasksView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cols');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | undefined>();
  const [searchTasks, setSearchTasks] = useState<Task[] | undefined>();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (search) {
        handleSearch(search);
      } else {
        setSearchResults(undefined);
        setSearchTasks(undefined);
      }
    }, SEARCH_TIMEOUT);
  }, [search]);

  const handleSearch = async (searchTerm: string) => {
    try {
      const results = await fetchSearchResults({ query: searchTerm, collection: 'tasks' });
      setSearchResults(results);
      // Convert search results to Task objects and set them directly
      const searchTasksList = results.taskResults?.map(taskResult => ({
        id: taskResult.id,
        title: taskResult.title,
        description: taskResult.description || '',
        status: taskResult.status as any,
        priority: taskResult.priority as any,
        dueDate: taskResult.dueDate ? new Date(taskResult.dueDate * 1000) : undefined,
      } as Task)) || [];
      setSearchTasks(searchTasksList.length > 0 ? searchTasksList : undefined);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(undefined);
      setSearchTasks(undefined);
    }
  };

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  // Check for create=true query parameter on mount
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
      // Remove the query parameter after opening the modal
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check for taskId query parameter to open a specific task
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId) {
      // We need to fetch the task and set it as active
      // For now, we'll just trigger the modal open by creating a minimal task object
      // The TaskModal should handle fetching the full task data
      setActiveTask({ id: taskId } as Task);
      // Remove the query parameter after opening the modal
      searchParams.delete('taskId');
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

      <div className="flex">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks"
        />
      </div>
      
      {viewMode === 'cols' && (
        <TaskCols 
          setActiveTask={setActiveTask}
          activeTask={activeTask}
          searchTasks={searchTasks}
        />
      )}
      
      {viewMode === 'rows' && (
        <TaskRows
          setActiveTask={setActiveTask}
          activeTask={activeTask}
          searchTasks={searchTasks}
        />
      )}

      <TaskModal 
        task={activeTask || undefined}
        open={createModalOpen || activeTask !== null}
        onClose={() => {
          setCreateModalOpen(false);
          setActiveTask(null);
        }}
      />
    </div>
  );
}
