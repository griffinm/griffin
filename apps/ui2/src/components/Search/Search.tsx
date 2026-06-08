import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch, IconFileText, IconChecklist } from '@tabler/icons-react';
import { SearchResults } from '@/types/search';
import { fetchSearchResults } from '@/api/searchApi';
import { useNavigate } from 'react-router-dom';
import { useOpenNote } from '@/hooks/useOpenNote';
import { useNotebooks } from '@/hooks/useNotebooks';
import { getNotebookPathString } from '@/utils/notebookPath';

const SEARCH_TIMEOUT = 300;

// Shared treatment for highlighted match tokens in snippets — teal-tinted and
// color-scheme aware, instead of the harsh default yellow.
const MARK_STYLES =
  '[&_mark]:rounded-sm [&_mark]:bg-[var(--mantine-color-teal-light)] [&_mark]:px-1 [&_mark]:py-px [&_mark]:font-medium [&_mark]:text-[var(--mantine-color-teal-light-color)]';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--mantine-color-dimmed)]">
      {children}
    </div>
  );
}

export function Search() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults | undefined>();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { openNote } = useOpenNote();
  const { data: allNotebooks } = useNotebooks();

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

  const dismiss = () => {
    setSearchTerm('');
    setSearchResults(undefined);
  };

  const renderResults = () => {
    if (!searchResults) {
      return null;
    }

    const hasNoteResults = searchResults.noteResults && searchResults.noteResults.length > 0;
    const hasTaskResults = searchResults.taskResults && searchResults.taskResults.length > 0;

    if (!hasNoteResults && !hasTaskResults) {
      return (
        <div className="px-4 py-6 text-center text-sm text-[var(--mantine-color-dimmed)]">
          No results for <span className="font-medium">“{searchTerm}”</span>
        </div>
      );
    }

    return (
      <div className="py-1">
        {/* Note Results */}
        {hasNoteResults && <SectionLabel>Notes</SectionLabel>}
        {searchResults.noteResults?.map((result) => {
          const notebookPath = getNotebookPathString(result.notebookId, allNotebooks);
          return (
            <button
              key={`note-${result.id}`}
              type="button"
              className="group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--mantine-color-default-hover)]"
              onClick={() => {
                dismiss();
                openNote(result.id, result.title);
              }}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--mantine-color-teal-light)] text-[var(--mantine-color-teal-light-color)]">
                <IconFileText size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{result.title || 'Untitled Note'}</div>
                {notebookPath && (
                  <div className="truncate text-xs text-[var(--mantine-color-dimmed)]">{notebookPath}</div>
                )}
                {result.snippet && (
                  <div
                    className={`mt-0.5 truncate text-xs text-[var(--mantine-color-dimmed)] ${MARK_STYLES}`}
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </div>
            </button>
          );
        })}

        {/* Task Results */}
        {hasTaskResults && <SectionLabel>Tasks</SectionLabel>}
        {searchResults.taskResults?.map((result) => {
          return (
            <button
              key={`task-${result.id}`}
              type="button"
              className="group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--mantine-color-default-hover)]"
              onClick={() => {
                dismiss();
                navigate(`/tasks?taskId=${result.id}`);
              }}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--mantine-color-green-light)] text-[var(--mantine-color-green-light-color)]">
                <IconChecklist size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{result.title}</div>
                {result.snippet && (
                  <div
                    className={`mt-0.5 truncate text-xs text-[var(--mantine-color-dimmed)] ${MARK_STYLES}`}
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-md" style={{ flexShrink: 1 }}>
      <TextInput
        placeholder="Search notes and tasks..."
        size="sm"
        radius="md"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftSection={<IconSearch size={16} />}
        styles={{
          input: {
            backgroundColor: 'var(--mantine-color-body)',
          },
        }}
      />
      {searchTerm && searchResults && (
        <div className="absolute left-0 z-50 mt-2 w-[34rem] max-w-[90vw] max-h-96 overflow-y-auto overflow-hidden rounded-lg border border-[var(--mantine-color-default-border)] bg-[var(--mantine-color-body)] shadow-xl">
          {renderResults()}
        </div>
      )}
    </div>
  );
}
