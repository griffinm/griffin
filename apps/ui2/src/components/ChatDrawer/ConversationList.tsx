import { useState, type ReactNode } from 'react';
import { Text, Box, Stack, Loader, Menu, ActionIcon, TextInput } from '@mantine/core';
import { IconDotsVertical, IconTrash, IconPencil } from '@tabler/icons-react';
import { ConversationWithItems } from '@/types/conversation';

interface ConversationListProps {
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId?: string | null;
  onSelectConversation: (_conversationId: string) => void;
  onDeleteConversation?: (_conversationId: string) => void;
  onRenameConversation?: (_conversationId: string, _title: string) => void;
  /** Client-side filter over title + first-message preview. */
  searchQuery?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
}

type Bucket = 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older';
const BUCKET_ORDER: Bucket[] = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

function bucketFor(date: Date): Bucket {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date);
  const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 days';
  return 'Older';
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="chat-mono"
      style={{
        padding: '14px 8px 6px',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--mantine-color-dimmed)',
      }}
    >
      {children}
    </div>
  );
}

interface ItemProps {
  conversation: ConversationWithItems;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onStartRename?: () => void;
  onCommitRename?: (_title: string) => void;
  onCancelRename: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  onSelect,
  onDelete,
  onStartRename,
  onCommitRename,
  onCancelRename,
}: ItemProps) {
  const [draft, setDraft] = useState(conversation.title || '');
  const previewText = conversation.conversationItems?.[0]?.content || 'No messages';
  const truncatedPreview =
    previewText.length > 90 ? previewText.substring(0, 90) + '…' : previewText;

  return (
    <Box
      className="group"
      onClick={() => !isEditing && onSelect()}
      style={{
        position: 'relative',
        padding: '9px 10px 9px 13px',
        borderRadius: 10,
        border: `1px solid ${isActive ? 'transparent' : 'transparent'}`,
        background: isActive ? 'var(--chat-assistant-tint)' : 'transparent',
        cursor: isEditing ? 'default' : 'pointer',
        overflow: 'hidden',
        transition: 'background 140ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isEditing)
          e.currentTarget.style.background = 'var(--mantine-color-default-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isEditing) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Active aurora accent rail */}
      {isActive && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 3,
            background: 'var(--chat-aurora)',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <TextInput
              size="xs"
              autoFocus
              value={draft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitRename?.(draft);
                } else if (e.key === 'Escape') {
                  onCancelRename();
                }
              }}
              onBlur={() => onCommitRename?.(draft)}
              styles={{ input: { fontSize: 13, fontWeight: 500 } }}
            />
          ) : (
            <Text
              fw={isActive ? 600 : 500}
              size="sm"
              truncate
              style={{ color: 'var(--mantine-color-text)' }}
            >
              {conversation.title || 'Untitled chat'}
            </Text>
          )}

          {!isEditing && (
            <>
              <Text size="xs" c="dimmed" truncate mt={2}>
                {truncatedPreview}
              </Text>
              <Text className="chat-mono" size="xs" c="dimmed" mt={3} style={{ fontSize: 10.5 }}>
                {new Date(conversation.updatedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
                {new Date(conversation.updatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </>
          )}
        </div>

        {!isEditing && (onDelete || onStartRename) && (
          <Menu position="bottom-end" shadow="md" withinPortal>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100 data-[expanded]:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label="Conversation options"
              >
                <IconDotsVertical size={15} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {onStartRename && (
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename();
                  }}
                >
                  Rename
                </Menu.Item>
              )}
              {onDelete && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Delete
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </div>
    </Box>
  );
}

export const ConversationList = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  searchQuery = '',
  emptyMessage = 'No conversations yet',
  emptySubMessage,
}: ConversationListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader size="sm" color="teal" />
      </Box>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? conversations.filter((c) => {
        const title = (c.title || '').toLowerCase();
        const preview = (c.conversationItems?.[0]?.content || '').toLowerCase();
        return title.includes(query) || preview.includes(query);
      })
    : conversations;

  if (filtered.length === 0) {
    return (
      <Box style={{ textAlign: 'center', padding: 40 }}>
        <Text c="dimmed" size="sm">
          {query ? 'No matching conversations' : emptyMessage}
        </Text>
        {!query && emptySubMessage && (
          <Text size="xs" c="dimmed" mt="xs">
            {emptySubMessage}
          </Text>
        )}
      </Box>
    );
  }

  // Group by recency, preserving the backend's updatedAt-desc order.
  const grouped = BUCKET_ORDER.map(
    (bucket) =>
      [
        bucket,
        filtered.filter((c) => bucketFor(new Date(c.updatedAt)) === bucket),
      ] as const
  ).filter(([, items]) => items.length > 0);

  return (
    <Stack gap={1}>
      {grouped.map(([bucket, items]) => (
        <div key={bucket}>
          <GroupLabel>{bucket}</GroupLabel>
          <Stack gap={1}>
            {items.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                isEditing={editingId === conversation.id}
                onSelect={() => onSelectConversation(conversation.id)}
                onDelete={
                  onDeleteConversation
                    ? () => onDeleteConversation(conversation.id)
                    : undefined
                }
                onStartRename={
                  onRenameConversation ? () => setEditingId(conversation.id) : undefined
                }
                onCommitRename={(title) => {
                  setEditingId(null);
                  const trimmed = title.trim();
                  if (trimmed && trimmed !== conversation.title) {
                    onRenameConversation?.(conversation.id, trimmed);
                  }
                }}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </Stack>
        </div>
      ))}
    </Stack>
  );
};
