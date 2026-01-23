import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResults } from '@/types/search';
import { fetchSearchResults } from '@/api/searchApi';

const SEARCH_TIMEOUT = 300;
const MIN_SEARCH_LENGTH = 2;

interface UseQuestionsSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: SearchResults | undefined;
  isSearching: boolean;
  isLoading: boolean;
  clearSearch: () => void;
}

export function useQuestionsSearch(): UseQuestionsSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResults | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH;

  const performSearch = useCallback(async (term: string) => {
    if (term.length < MIN_SEARCH_LENGTH) {
      setResults(undefined);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await fetchSearchResults({
        query: term,
        collection: 'questions',
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      setResults(undefined);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, SEARCH_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults(undefined);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    isLoading,
    clearSearch,
  };
}
