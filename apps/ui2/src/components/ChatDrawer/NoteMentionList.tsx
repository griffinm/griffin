import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Loader } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { fetchSearchResults } from '@/api/searchApi';
import {
  MenuPanel,
  MenuRow,
  MenuStatus,
} from '@/components/Editor/plugins/NoteLink/MenuPrimitives';

const SEARCH_TIMEOUT = 300;
const MIN_SEARCH_LENGTH = 2;

export interface NoteMentionItem {
  id: string;
  label: string;
  notebookId?: string;
  snippet?: string;
}

export interface NoteMentionListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean;
}

interface NoteMentionListProps {
  /** Text typed after the "@" trigger. */
  query: string;
  /** Called when the user picks a note (mouse or Enter). */
  command: (_item: NoteMentionItem) => void;
}

/**
 * "@"-mention note search for the chat composer. Reuses the editor's command-menu
 * primitives and the shared Typesense search (owner-scoped by userId). Mirrors
 * `Editor/plugins/NoteLink/NoteLinkList.tsx` but is plain (no TipTap) so it can be
 * driven by the textarea composer.
 */
export const NoteMentionList = forwardRef<NoteMentionListRef, NoteMentionListProps>(
  ({ query, command }, ref) => {
    const [items, setItems] = useState<NoteMentionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(null);

      if (query.length < MIN_SEARCH_LENGTH) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timeoutRef.current = setTimeout(() => {
        fetchSearchResults({ query, collection: 'notes' })
          .then((res) => {
            setItems(
              (res.noteResults || []).map((r) => ({
                id: r.id,
                label: r.title || 'Untitled',
                notebookId: r.notebookId,
                snippet: r.snippet,
              })),
            );
          })
          .catch(() => {
            setItems([]);
            setError('Search failed');
          })
          .finally(() => setLoading(false));
      }, SEARCH_TIMEOUT);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [query]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) => {
          if (items.length === 0) return false;
          if (event.key === 'ArrowUp') {
            setSelectedIndex((i) => (i + items.length - 1) % items.length);
            return true;
          }
          if (event.key === 'ArrowDown') {
            setSelectedIndex((i) => (i + 1) % items.length);
            return true;
          }
          if (event.key === 'Enter') {
            const item = items[selectedIndex];
            if (item) command(item);
            return true;
          }
          return false;
        },
      }),
      [items, selectedIndex, command],
    );

    const renderBody = () => {
      if (loading) {
        return (
          <MenuStatus>
            <span className="flex items-center gap-2">
              <Loader size="xs" />
              Searching…
            </span>
          </MenuStatus>
        );
      }

      if (error) {
        return <MenuStatus tone="error">{error}</MenuStatus>;
      }

      if (items.length === 0) {
        const hint =
          query.length < MIN_SEARCH_LENGTH
            ? 'Type to search your notes…'
            : 'No matching notes';
        return <MenuStatus>{hint}</MenuStatus>;
      }

      return items.map((item, index) => (
        <MenuRow
          key={item.id}
          selected={index === selectedIndex}
          onSelect={() => selectItem(index)}
          leading={<IconFileText size={16} />}
          title={item.label}
          description={
            item.snippet ? (
              <span dangerouslySetInnerHTML={{ __html: item.snippet }} />
            ) : undefined
          }
        />
      ));
    };

    return <MenuPanel label="Attach a note">{renderBody()}</MenuPanel>;
  },
);

NoteMentionList.displayName = 'NoteMentionList';
