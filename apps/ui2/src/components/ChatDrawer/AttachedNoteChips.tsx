import { Pill } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { AttachedNoteRef } from '@/types/conversation';

interface AttachedNoteChipsProps {
  notes: AttachedNoteRef[];
  /** When provided, chips show a remove button (composer use). Otherwise chips
   * are click-to-open (rendered under a sent message). */
  onRemove?: (_id: string) => void;
}

/**
 * Compact pill row for notes attached to a chat message — removable while
 * composing, click-to-open once sent.
 */
export function AttachedNoteChips({ notes, onRemove }: AttachedNoteChipsProps) {
  if (!notes || notes.length === 0) return null;

  const removable = !!onRemove;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {notes.map((note) => (
        <Pill
          key={note.id}
          size="md"
          withRemoveButton={removable}
          onRemove={removable ? () => onRemove?.(note.id) : undefined}
          // Use window.location (matching ChatNoteCard) to avoid router-hook
          // coupling in chat surfaces that render outside a Router context.
          onClick={
            removable
              ? undefined
              : () => {
                  if (note.id) window.location.href = `/notes/${note.id}`;
                }
          }
          style={{
            cursor: removable ? 'default' : 'pointer',
            background: 'var(--mantine-color-default-hover)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              maxWidth: 220,
            }}
          >
            <IconFileText size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {note.title || 'Untitled'}
            </span>
          </span>
        </Pill>
      ))}
    </div>
  );
}
