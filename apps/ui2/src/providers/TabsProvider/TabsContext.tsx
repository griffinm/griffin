import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tab, TabsState } from '@/types/tabs';

const STORAGE_KEY = 'griffin-note-tabs';

interface TabsContextProps {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (_noteId: string, _title?: string) => void;
  closeTab: (_noteId: string) => void;
  setActiveTab: (_noteId: string) => void;
  updateTabTitle: (_noteId: string, _title: string) => void;
}

const loadTabsFromStorage = (): TabsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load tabs from localStorage:', e);
  }
  return { tabs: [], activeTabId: null };
};

const saveTabsToStorage = (state: TabsState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save tabs to localStorage:', e);
  }
};

export const TabsContext = createContext<TabsContextProps>({
  tabs: [],
  activeTabId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  openTab: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  closeTab: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveTab: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateTabTitle: () => {},
});

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [tabs, setTabs] = useState<Tab[]>(() => loadTabsFromStorage().tabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(() => loadTabsFromStorage().activeTabId);

  // Persist to localStorage on state change
  useEffect(() => {
    saveTabsToStorage({ tabs, activeTabId });
  }, [tabs, activeTabId]);

  // Sync active tab with current route
  useEffect(() => {
    const match = location.pathname.match(/^\/notes\/([^/]+)$/);
    if (match) {
      const noteId = match[1];
      if (tabs.some(t => t.noteId === noteId)) {
        setActiveTabId(noteId);
      }
    }
  }, [location.pathname, tabs]);

  const openTab = useCallback((noteId: string, title?: string) => {
    setTabs(currentTabs => {
      const existingTab = currentTabs.find(t => t.noteId === noteId);
      if (existingTab) {
        // Tab already exists, just activate it
        return currentTabs;
      }
      // Create new tab
      const newTab: Tab = {
        noteId,
        title: title || 'Untitled',
        addedAt: Date.now(),
      };
      return [...currentTabs, newTab];
    });
    setActiveTabId(noteId);
  }, []);

  const closeTab = useCallback((noteId: string) => {
    setTabs(currentTabs => {
      const index = currentTabs.findIndex(t => t.noteId === noteId);
      if (index === -1) return currentTabs;

      const newTabs = currentTabs.filter(t => t.noteId !== noteId);

      // Handle navigation if closing the active tab
      if (activeTabId === noteId) {
        if (newTabs.length === 0) {
          setActiveTabId(null);
          navigate('/');
        } else if (index < newTabs.length) {
          // Activate the tab that's now at this index
          const nextTab = newTabs[index];
          setActiveTabId(nextTab.noteId);
          navigate(`/notes/${nextTab.noteId}`);
        } else {
          // Activate the last tab
          const prevTab = newTabs[newTabs.length - 1];
          setActiveTabId(prevTab.noteId);
          navigate(`/notes/${prevTab.noteId}`);
        }
      }

      return newTabs;
    });
  }, [activeTabId, navigate]);

  const setActiveTabHandler = useCallback((noteId: string) => {
    const tab = tabs.find(t => t.noteId === noteId);
    if (tab) {
      setActiveTabId(noteId);
      navigate(`/notes/${noteId}`);
    }
  }, [tabs, navigate]);

  const updateTabTitle = useCallback((noteId: string, title: string) => {
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.noteId === noteId ? { ...tab, title } : tab
      )
    );
  }, []);

  return (
    <TabsContext.Provider value={{
      tabs,
      activeTabId,
      openTab,
      closeTab,
      setActiveTab: setActiveTabHandler,
      updateTabTitle,
    }}>
      {children}
    </TabsContext.Provider>
  );
}
