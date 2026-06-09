import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Loader } from '@mantine/core'
import { IconFileText, IconLink } from '@tabler/icons-react'
import { fetchSearchResults } from '@/api/searchApi'
import { fetchNoteById } from '@/api/notesApi'
import { MenuPanel, MenuRow, MenuStatus } from './MenuPrimitives'

const SEARCH_TIMEOUT = 300
const MIN_SEARCH_LENGTH = 2
// Matches a note URL (full URL or relative path) and captures the note id.
const NOTE_URL_REGEX = /\/notes\/([\w-]+)/

interface NoteLinkItem {
  id: string
  label: string
  snippet?: string
}

export interface NoteLinkListRef {
  /** Returns true if the key was handled by the popup. */
  onKeyDown: (_event: KeyboardEvent) => boolean
}

interface NoteLinkListProps {
  /** Text typed after the "@" trigger (a search term or a pasted note URL). */
  query: string
  /** Inserts the note-link node for the chosen note. */
  command: (_item: { id: string; label: string }) => void
}

export const NoteLinkList = forwardRef<NoteLinkListRef, NoteLinkListProps>(
  ({ query, command }, ref) => {
    const [items, setItems] = useState<NoteLinkItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // A pasted note URL takes precedence over free-text search.
    const pastedNoteId = query.match(NOTE_URL_REGEX)?.[1]

    useEffect(() => {
      setSelectedIndex(0)
    }, [query])

    useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setError(null)

      // Paste-a-link path: resolve the note by id. Ownership is enforced by the
      // backend (GET /notes/:id -> findOneForUser), so a 404 means "not yours".
      if (pastedNoteId) {
        setLoading(true)
        fetchNoteById(pastedNoteId)
          .then((note) => {
            setItems([{ id: note.id, label: note.title || 'Untitled' }])
          })
          .catch(() => {
            setItems([])
            setError('Note not found or not yours')
          })
          .finally(() => setLoading(false))
        return
      }

      // Search path: reuse the existing Typesense search (owner-scoped by userId).
      if (query.length < MIN_SEARCH_LENGTH) {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      timeoutRef.current = setTimeout(() => {
        fetchSearchResults({ query, collection: 'notes' })
          .then((res) => {
            setItems(
              (res.noteResults || []).map((r) => ({
                id: r.id,
                label: r.title || 'Untitled',
                snippet: r.snippet,
              })),
            )
          })
          .catch(() => {
            setItems([])
            setError('Search failed')
          })
          .finally(() => setLoading(false))
      }, SEARCH_TIMEOUT)

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [query, pastedNoteId])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command({ id: item.id, label: item.label })
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) => {
          if (items.length === 0) return false
          if (event.key === 'ArrowUp') {
            setSelectedIndex((i) => (i + items.length - 1) % items.length)
            return true
          }
          if (event.key === 'ArrowDown') {
            setSelectedIndex((i) => (i + 1) % items.length)
            return true
          }
          if (event.key === 'Enter') {
            const item = items[selectedIndex]
            if (item) command({ id: item.id, label: item.label })
            return true
          }
          return false
        },
      }),
      [items, selectedIndex, command],
    )

    const renderBody = () => {
      if (loading) {
        return (
          <MenuStatus>
            <span className="flex items-center gap-2">
              <Loader size="xs" />
              {pastedNoteId ? 'Resolving note…' : 'Searching…'}
            </span>
          </MenuStatus>
        )
      }

      if (error) {
        return <MenuStatus tone="error">{error}</MenuStatus>
      }

      if (items.length === 0) {
        const hint =
          query.length < MIN_SEARCH_LENGTH && !pastedNoteId
            ? 'Type to search your notes, or paste a note link…'
            : 'No matching notes'
        return <MenuStatus>{hint}</MenuStatus>
      }

      return items.map((item, index) => (
        <MenuRow
          key={item.id}
          selected={index === selectedIndex}
          onSelect={() => selectItem(index)}
          leading={pastedNoteId ? <IconLink size={16} /> : <IconFileText size={16} />}
          title={item.label}
          description={
            item.snippet ? (
              <span dangerouslySetInnerHTML={{ __html: item.snippet }} />
            ) : undefined
          }
        />
      ))
    }

    return <MenuPanel label="Link to note">{renderBody()}</MenuPanel>
  },
)

NoteLinkList.displayName = 'NoteLinkList'
