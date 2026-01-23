import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabsContext } from '@/providers/TabsProvider';

export function useOpenNote() {
  const navigate = useNavigate();
  const { openTab } = useTabsContext();

  const openNote = useCallback((noteId: string, knownTitle?: string) => {
    openTab(noteId, knownTitle);
    navigate(`/notes/${noteId}`);
  }, [openTab, navigate]);

  return { openNote };
}
