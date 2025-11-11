import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput, Badge } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { SearchResults } from '@/types/search';
import { fetchSearchResults } from '@/api/searchApi';
import { useNavigate } from 'react-router-dom';

const SEARCH_TIMEOUT = 300;

export function Search() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults | undefined>();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedSearch = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults(undefined);
      }
    }, SEARCH_TIMEOUT);
  }, [searchTerm]);

  const handleSearch = async (searchTerm: string) => {
    try {
      const results = await fetchSearchResults({ query: searchTerm, collection: 'all' });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(undefined);
    }
  };

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  // Handle clicks outside the search component to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchTerm('');
        setSearchResults(undefined);
      }
    };

    // Only add the event listener if search results are visible
    if (searchTerm && searchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchTerm, searchResults]);
  
  const renderResults = () => {
    if (!searchResults) {
      return null;
    }

    const hasNoteResults = searchResults.noteResults && searchResults.noteResults.length > 0;
    const hasTaskResults = searchResults.taskResults && searchResults.taskResults.length > 0;

    if (!hasNoteResults && !hasTaskResults) {
      return (
        <div className="p-3 text-gray-500 text-sm">
          No results found
        </div>
      );
    }

    return (
      <>
        {/* Note Results */}
        {searchResults.noteResults?.map((result) => {
          return (
            <div
              key={`note-${result.id}`}
              className="flex flex-col p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 z-50"
              onClick={() => {
                setSearchTerm('');
                setSearchResults(undefined);
                navigate(`/notes/${result.id}`);
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge size="xs" color="blue" variant="light">Note</Badge>
                <div className="font-medium text-sm">{result.title}</div>
              </div>
              {result.snippet && (
                <div 
                  className="text-xs text-gray-500 italic mt-1" 
                  dangerouslySetInnerHTML={{ __html: result.snippet }} 
                />
              )}
            </div>
          );
        })}

        {/* Task Results */}
        {searchResults.taskResults?.map((result) => {
          return (
            <div
              key={`task-${result.id}`}
              className="flex flex-col p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 z-50"
              onClick={() => {
                setSearchTerm('');
                setSearchResults(undefined);
                navigate(`/tasks?taskId=${result.id}`);
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge size="xs" color="green" variant="light">Task</Badge>
                <div className="font-medium text-sm">{result.title}</div>
              </div>
              {result.snippet && (
                <div 
                  className="text-xs text-gray-500 italic mt-1" 
                  dangerouslySetInnerHTML={{ __html: result.snippet }} 
                />
              )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-md" style={{ flexShrink: 1 }}>
      <TextInput
        placeholder="Search notes and tasks..."
        size="sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftSection={<IconSearch size={16} />}
        styles={{
          input: {
            backgroundColor: 'white',
          }
        }}
      />
      {searchTerm && searchResults && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {renderResults()}
        </div>
      )}
    </div>
  );
}

