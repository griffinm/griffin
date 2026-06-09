import { useRef, useState } from 'react';
import { Box, Textarea, ActionIcon } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import { AttachedNoteRef } from '@/types/conversation';
import { AttachedNoteChips } from './AttachedNoteChips';
import {
  NoteMentionList,
  type NoteMentionItem,
  type NoteMentionListRef,
} from './NoteMentionList';

interface ChatInputProps {
  value: string;
  onChange: (_value: string) => void;
  /** Sends the message along with any notes attached via "@". */
  onSend: (_attachedNotes: AttachedNoteRef[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Center the composer within a reading column (full page); omit in the drawer. */
  contentMaxWidth?: number;
}

/** The active "@" mention being typed: the search query and where the token starts. */
interface MentionState {
  query: string;
  start: number;
}

/**
 * Find the "@" token the caret is currently inside, if any. The token must start
 * at the beginning of the input or follow whitespace, and contain no whitespace.
 */
function findMention(value: string, caret: number): MentionState | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;
  const charBefore = at > 0 ? value[at - 1] : '';
  if (charBefore && !/\s/.test(charBefore)) return null;
  const query = before.slice(at + 1);
  if (/\s/.test(query)) return null;
  return { query, start: at };
}

/**
 * Elevated, autosizing composer. Enter sends, Shift+Enter inserts a newline.
 * Typing "@" opens a note search; the chosen notes ride along as context chips
 * and are sent with the message. The panel picks up an aurora focus glow; the
 * send button carries the gradient.
 */
export const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  autoFocus = false,
  contentMaxWidth,
}: ChatInputProps) => {
  const [focused, setFocused] = useState(false);
  const [attachedNotes, setAttachedNotes] = useState<AttachedNoteRef[]>([]);
  const [mention, setMention] = useState<MentionState | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<NoteMentionListRef>(null);

  const canSend = !!value.trim() && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(attachedNotes);
    setAttachedNotes([]);
    setMention(null);
  };

  const removeNote = (id: string) =>
    setAttachedNotes((prev) => prev.filter((n) => n.id !== id));

  const handleSelectNote = (item: NoteMentionItem) => {
    setAttachedNotes((prev) =>
      prev.some((n) => n.id === item.id)
        ? prev
        : [
            ...prev,
            { id: item.id, title: item.label, notebookId: item.notebookId },
          ]
    );

    // Strip the "@token" the user was typing, then restore the caret there.
    if (mention) {
      const el = textareaRef.current;
      const caret = el ? el.selectionStart : value.length;
      const nextValue = value.slice(0, mention.start) + value.slice(caret);
      onChange(nextValue);
      const nextCaret = mention.start;
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        if (node) {
          node.focus();
          node.setSelectionRange(nextCaret, nextCaret);
        }
      });
    }
    setMention(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.currentTarget.value;
    onChange(next);
    const caret = e.currentTarget.selectionStart ?? next.length;
    setMention(findMention(next, caret));
  };

  // Re-evaluate the active mention after caret-only moves (clicks, arrows when
  // the popup is closed). Navigation keys handled by the popup are skipped.
  const syncMention = () => {
    const el = textareaRef.current;
    if (!el) return;
    setMention(findMention(el.value, el.selectionStart ?? el.value.length));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMention(null);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        const handled = popupRef.current?.onKeyDown(e.nativeEvent);
        if (handled) {
          e.preventDefault();
          return;
        }
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      mention &&
      (e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Enter' ||
        e.key === 'Escape')
    ) {
      return;
    }
    syncMention();
  };

  return (
    <Box
      style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid var(--mantine-color-default-border)',
        background: 'transparent',
      }}
    >
      <Box
        style={{
          maxWidth: contentMaxWidth,
          margin: contentMaxWidth ? '0 auto' : undefined,
          position: 'relative',
        }}
      >
        {mention && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              zIndex: 1000,
            }}
          >
            <NoteMentionList
              ref={popupRef}
              query={mention.query}
              command={handleSelectNote}
            />
          </div>
        )}

        {attachedNotes.length > 0 && (
          <Box style={{ marginBottom: 8 }}>
            <AttachedNoteChips notes={attachedNotes} onRemove={removeNote} />
          </Box>
        )}

        <Box
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: '6px 6px 6px 14px',
            borderRadius: 18,
            background: 'var(--mantine-color-body)',
            border: `1px solid ${focused ? 'transparent' : 'var(--mantine-color-default-border)'}`,
            boxShadow: focused
              ? '0 0 0 1.5px var(--chat-accent), 0 8px 24px -12px var(--chat-glow)'
              : 'var(--mantine-shadow-xs)',
            transition: 'box-shadow 160ms ease, border-color 160ms ease',
          }}
        >
          <Textarea
            ref={textareaRef}
            variant="unstyled"
            placeholder="Message the assistant…  (@ to attach a note)"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={syncMention}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setMention(null);
            }}
            disabled={disabled}
            autosize
            minRows={1}
            maxRows={6}
            autoFocus={autoFocus}
            style={{ flex: 1 }}
            styles={{ input: { fontSize: 14, lineHeight: 1.55, padding: '6px 0' } }}
          />
          <ActionIcon
            size={34}
            radius="xl"
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
            style={{
              background: canSend ? 'var(--chat-aurora)' : 'var(--mantine-color-default-hover)',
              color: canSend ? '#fff' : 'var(--mantine-color-dimmed)',
              border: 'none',
              flexShrink: 0,
            }}
          >
            <IconArrowUp size={18} stroke={2.4} />
          </ActionIcon>
        </Box>
        <div
          className="chat-mono"
          style={{
            marginTop: 6,
            paddingLeft: 4,
            fontSize: 10.5,
            letterSpacing: '0.02em',
            color: 'var(--mantine-color-dimmed)',
          }}
        >
          ⏎ send&nbsp;&nbsp;·&nbsp;&nbsp;⇧⏎ newline&nbsp;&nbsp;·&nbsp;&nbsp;@ attach note
        </div>
      </Box>
    </Box>
  );
};
