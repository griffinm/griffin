import { RefObject } from 'react';
import { Stack, Box, Text, Loader, ScrollArea } from '@mantine/core';
import { ConversationItem } from '@/types/conversation';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { prepareMessagesForDisplay } from './chatUtils';

interface ChatMessageListProps {
  messages: ConversationItem[];
  isLoading: boolean;
  isWaitingForResponse: boolean;
  viewportRef: RefObject<HTMLDivElement>;
}

export const ChatMessageList = ({
  messages,
  isLoading,
  isWaitingForResponse,
  viewportRef,
}: ChatMessageListProps) => {
  if (isLoading) {
    return (
      <ScrollArea style={{ flex: 1 }}>
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size="md" />
        </Box>
      </ScrollArea>
    );
  }

  if (messages.length === 0) {
    return (
      <ScrollArea style={{ flex: 1, paddingTop: '15px' }}>
        <Box style={{ textAlign: 'center', padding: 40 }}>
          <Text c="dimmed">No messages yet</Text>
        </Box>
      </ScrollArea>
    );
  }

  const displayMessages = prepareMessagesForDisplay(messages);

  return (
    <ScrollArea style={{ flex: 1, paddingTop: '15px' }} viewportRef={viewportRef}>
      <Stack gap={0}>
        {displayMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isWaitingForResponse && <TypingIndicator />}
      </Stack>
    </ScrollArea>
  );
};
