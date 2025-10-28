import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '@/types/task';
import { SearchResults } from '@/types/search';
import { fetchSearchResults } from '@/api/searchApi';

const SEARCH_TIMEOUT = 300;

export function useTasksSearch() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | undefined>();
  const [searchTasks, setSearchTasks] = useState<Task[] | undefined>();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchTerm: string) => {
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
  }, []);

  // Debounced search effect
  useEffect(() => {
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

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [search, handleSearch]);

  return {
    search,
    setSearch,
    searchResults,
    searchTasks,
  };
}

