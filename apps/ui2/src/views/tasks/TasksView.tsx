import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '@/types/task';
import { Tag } from '@/types/tag';
import { TaskModal } from '@/components/tasks';
import { TaskCols } from '@/components/tasks/TaskCols';
import { TaskRows } from '@/components/tasks/TaskRows';
import { TasksHeader, ViewMode } from '@/components/tasks/TasksHeader';
import { TasksFilters } from '@/components/tasks/TasksFilters';
import { useTasksSearch } from '@/hooks/useTasksSearch';
import { searchTags } from '@/api/tagsApi';

export function TasksView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cols');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  const { search, setSearch, searchTasks } = useTasksSearch();

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

  // Load available tags
  useEffect(() => {
    searchTags().then(setAvailableTags).catch(console.error);
  }, []);

  return (
    <div className="p-5 w-full max-w-full overflow-hidden">
      <TasksHeader
        onCreateClick={() => setCreateModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <TasksFilters
        search={search}
        onSearchChange={setSearch}
        selectedPriorities={selectedPriorities}
        onPrioritiesChange={setSelectedPriorities}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        availableTags={availableTags}
      />
      
      {viewMode === 'cols' && (
        <TaskCols 
          setActiveTask={setActiveTask}
          activeTask={activeTask}
          searchTasks={searchTasks}
          selectedPriorities={selectedPriorities}
          selectedTags={selectedTags}
        />
      )}
      
      {viewMode === 'rows' && (
        <TaskRows
          setActiveTask={setActiveTask}
          activeTask={activeTask}
          searchTasks={searchTasks}
          selectedPriorities={selectedPriorities}
          selectedTags={selectedTags}
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
