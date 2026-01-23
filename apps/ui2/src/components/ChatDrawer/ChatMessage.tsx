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
  console.log('ChatMessage rendering:', message.role, message.id, 'componentData:', !!message.componentData);

  const isUser = message.role === ConversationItemRole.USER;
  const isTool = message.role === ConversationItemRole.TOOL;

  console.log('Role check:', {
    role: message.role,
    expectedTool: ConversationItemRole.TOOL,
    isTool,
    typeofRole: typeof message.role
  });

  // Render tool messages if they have componentData
  if (isTool) {
    console.log('Tool message:', message);
    console.log('Tool message componentData:', message.componentData);
    if (!message.componentData) {
      console.log('No componentData, skipping tool message');
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
          <Box style={{ flex: 1, minWidth: 0 }}>
            <ChatComponentRenderer componentData={message.componentData} />
          </Box>
        </Group>
      </Box>
    );
  }

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
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
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isUser ? '#228be6' : '#868e96',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {isUser ? <IconUser size={18} /> : <IconRobot size={18} />}
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              backgroundColor: isUser ? '#e7f5ff' : '#f1f3f5',
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${isUser ? '#d0ebff' : '#dee2e6'}`,
            }}
          >
            <Box
              component="div"
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}
            >
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
            </Box>
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
