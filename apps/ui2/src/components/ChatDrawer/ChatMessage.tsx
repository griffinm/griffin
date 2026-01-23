import { Text, Box, Group } from '@mantine/core';
import { IconRobot, IconUser } from '@tabler/icons-react';
import { ConversationItem, ConversationItemRole } from '@/types/conversation';
import { ChatComponentRenderer } from './ChatComponentRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdownComponents';

interface ChatMessageProps {
  message: ConversationItem;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === ConversationItemRole.USER;
  const isTool = message.role === ConversationItemRole.TOOL;

  // Render tool messages if they have componentData
  if (isTool) {
    if (!message.componentData) {
      return null; // Don't show tool messages without component data
    }

    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: 12,
        }}
      >
        <Group
          gap="xs"
          style={{
            maxWidth: '90%',
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <div className="flex flex-1 min-w-0 ml-10">
            <ChatComponentRenderer componentData={message.componentData} />
          </div>
        </Group>
      </Box>
    );
  }

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
    >
      <Group
        gap="xs"
        style={{
          maxWidth: '85%',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
        }}
      >
        {!isUser && (
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#868e96',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <IconRobot size={18} />
          </Box>
        )}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              backgroundColor: isUser ? '#e7f5ff' : '#f1f3f5',
              padding: '3px 10px',
              borderRadius: 12,
              border: `1px solid ${isUser ? '#d0ebff' : '#dee2e6'}`,
            }}
          >
            <div className="text-sm leading-normal word-break-break-word">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <Text size="sm" c="dimmed">
                  Empty message
                </Text>
              )}
            </div>
          </Box>
          {/* Render component data if present */}
          {message.componentData && (
            <ChatComponentRenderer componentData={message.componentData} />
          )}
        </Box>
      </Group>
    </Box>
  );
};
