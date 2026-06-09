import { useState } from 'react';
import { Stack, Button, ScrollArea, TextInput, Box } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { ConversationWithItems } from '@/types/conversation';
import { ConversationList } from './ConversationList';

interface ChatHistoryPanelProps {
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId?: string | null;
  onSelectConversation: (_conversationId: string) => void;
  onDeleteConversation: (_conversationId: string) => void;
  onRenameConversation?: (_conversationId: string, _title: string) => void;
  onNewChat?: () => void;
}

export const ChatHistoryPanel = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewChat,
}: ChatHistoryPanelProps) => {
  const [search, setSearch] = useState('');

  return (
    <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onNewChat && (
          <Button
            fullWidth
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={onNewChat}
            styles={{ root: { background: 'var(--chat-aurora)', border: 'none', color: '#fff' } }}
          >
            New chat
          </Button>
        )}
        <TextInput
          placeholder="Search conversations"
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="sm"
          radius="md"
          styles={{ input: { fontFamily: 'var(--font-mono)', fontSize: 12.5 } }}
        />
      </Box>
      <ScrollArea style={{ flex: 1, padding: '0 8px 16px' }}>
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
    </Stack>
  );
};
