import { useState } from 'react';
import { Box, Button, ScrollArea, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { ConversationWithItems } from '@/types/conversation';
import { ConversationList } from '@/components/ChatDrawer/ConversationList';

interface ChatConversationRailProps {
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (_conversationId: string) => void;
  onDeleteConversation: (_conversationId: string) => void;
  onRenameConversation: (_conversationId: string, _title: string) => void;
  onNewChat: () => void;
  /** Full width on mobile, fixed rail width on desktop. */
  width?: number | string;
}

/**
 * Left rail for the full-page chat: new-chat action, search, and the
 * date-grouped conversation list.
 */
export const ChatConversationRail = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewChat,
  width = 300,
}: ChatConversationRailProps) => {
  const [search, setSearch] = useState('');

  return (
    <Box
      style={{
        width,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
      }}
    >
      <Box style={{ padding: '16px 14px 10px' }}>
        <Text
          className="chat-mono"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--mantine-color-dimmed)',
            marginBottom: 12,
            paddingLeft: 4,
          }}
        >
          Conversations
        </Text>
        <Button
          fullWidth
          radius="md"
          leftSection={<IconPlus size={16} />}
          onClick={onNewChat}
          styles={{ root: { background: 'var(--chat-aurora)', border: 'none', color: '#fff' } }}
        >
          New chat
        </Button>
        <TextInput
          mt={8}
          placeholder="Search conversations"
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          radius="md"
          styles={{ input: { fontFamily: 'var(--font-mono)', fontSize: 12.5 } }}
        />
      </Box>
      <ScrollArea style={{ flex: 1, padding: '0 6px 16px' }}>
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onRenameConversation={onRenameConversation}
          searchQuery={search}
          emptyMessage="No conversations yet"
          emptySubMessage="Start a new chat to begin"
        />
      </ScrollArea>
    </Box>
  );
};
