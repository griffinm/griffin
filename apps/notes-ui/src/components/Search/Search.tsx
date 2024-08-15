import { useState, useEffect, useRef, useCallback } from 'react';
import { TextField } from '@mui/material';
import { SearchResult } from '@griffin/types'
import { searchNotes } from '../../utils/api/noteClient'
import { useNotes } from '../../providers/NoteProvider'
import { useNavigate } from 'react-router-dom'
import { urls } from '../../utils/urls'

const SEARCH_TIMEOUT = 300;

export function Search() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { 
    fetchNotebook,
  } = useNotes();
  const debouncedSearch = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      }
    }, SEARCH_TIMEOUT);
  }, [searchTerm]);

  const handleSearch = async (searchTerm: string) => {
    const response = await searchNotes(searchTerm);
    setSearchResults(response.data);
  }

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);
  
  const renderResults = () => {
    if (!searchResults) {
      return null
    }

    if (searchResults.length === 0) {
      return <div>No results</div>
    }

    return searchResults.map((result) => {
      return (
        <div
          key={result.noteId}
          className="flex flex-col p-2 cursor-pointer hover:bg-dark-1 transition-colors"
          onClick={() => {
            setSearchTerm('');
            setSearchResults([]);
            fetchNotebook(result.notebookId);
            navigate(urls.note(result.noteId));
          }}
        >
          <div>{result.noteTitle}</div>
          <div className="text-sm text-slate-400 italic">{result.notebookTitle}</div>
        </div>
      )
    })
  }

  return (
    <div className="relative">
      <TextField
        fullWidth
        size="small"
        placeholder="Search"
        variant="outlined"
        onChange={(e) => setSearchTerm(e.target.value)}
        value={searchTerm}
        autoComplete="off"
      />
      {searchTerm && (
        <div className="absolute left-0 right-0 bg-dark-2 border border-slate-700 shadow-lg z-10">
          {renderResults()}
        </div>
      )}
    </div>
  )
}