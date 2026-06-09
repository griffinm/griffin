import { ReactNode, RefObject } from 'react';
import { Stack, Box, Text, Loader, ScrollArea } from '@mantine/core';
import { ConversationItem, ConversationItemRole } from '@/types/conversation';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { prepareMessagesForDisplay } from './chatUtils';

interface ChatMessageListProps {
  messages: ConversationItem[];
  isLoading: boolean;
  isWaitingForResponse: boolean;
  viewportRef: RefObject<HTMLDivElement>;
  /** Re-run the latest assistant turn (wired to the last assistant message). */
  onRegenerate?: () => void;
  /** Shown when the conversation has no messages yet. */
  emptyState?: ReactNode;
  /** Constrain messages to a centered reading column (full page); omit in the drawer. */
  contentMaxWidth?: number;
}

export const ChatMessageList = ({
  messages,
  isLoading,
  isWaitingForResponse,
  viewportRef,
  onRegenerate,
  emptyState,
  contentMaxWidth,
}: ChatMessageListProps) => {
  const column = (children: ReactNode) => (
    <Box
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: contentMaxWidth,
        margin: contentMaxWidth ? '0 auto' : undefined,
        padding: '16px 16px 8px',
      }}
    >
      {children}
    </Box>
  );

  if (isLoading) {
    return (
      <ScrollArea className="chat-surface" style={{ flex: 1 }}>
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader size="md" color="teal" />
        </Box>
      </ScrollArea>
    );
  }

  if (messages.length === 0) {
    return (
      <ScrollArea className="chat-surface" style={{ flex: 1 }}>
        {emptyState ?? (
          <Box style={{ textAlign: 'center', padding: 48 }}>
            <Text c="dimmed">No messages yet</Text>
          </Box>
        )}
      </ScrollArea>
    );
  }

  const displayMessages = prepareMessagesForDisplay(messages);

  // The latest assistant turn is the only one that gets a regenerate affordance.
  let lastAssistantId: string | undefined;
  for (const m of displayMessages) {
    if (m.role === ConversationItemRole.ASSISTANT && m.content) lastAssistantId = m.id;
  }

  return (
    <ScrollArea className="chat-surface" style={{ flex: 1 }} viewportRef={viewportRef}>
      {column(
        <Stack gap={4}>
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRegenerate={
                !isWaitingForResponse && onRegenerate && message.id === lastAssistantId
                  ? onRegenerate
                  : undefined
              }
            />
          ))}
          {isWaitingForResponse && <TypingIndicator />}
        </Stack>
      )}
    </ScrollArea>
  );
};
