import { Text, Box } from '@mantine/core';
import { ConversationItem, ConversationItemRole } from '@/types/conversation';
import { ChatComponentRenderer } from './ChatComponentRenderer';
import { AttachedNoteChips } from './AttachedNoteChips';
import { AssistantMark } from './AssistantMark';
import { MessageActions } from './MessageActions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdownComponents';

interface ChatMessageProps {
  message: ConversationItem;
  /** Provided only for the latest assistant turn to enable regeneration. */
  onRegenerate?: () => void;
}

const RoleLabel = ({ isUser }: { isUser: boolean }) => (
  <div
    className="chat-mono"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      color: 'var(--mantine-color-dimmed)',
    }}
  >
    {!isUser && <AssistantMark size={13} />}
    <span>{isUser ? 'You' : 'Assistant'}</span>
  </div>
);

/**
 * Bubbleless, document-style message. Both roles are full-width and
 * left-aligned, distinguished by a mono role label and (for the assistant) the
 * signature mark + a subtle aurora tint panel. Rich content — markdown, code,
 * and embedded task/note cards — gets the full column width.
 */
export const ChatMessage = ({ message, onRegenerate }: ChatMessageProps) => {
  const isUser = message.role === ConversationItemRole.USER;
  const isTool = message.role === ConversationItemRole.TOOL;

  // Tool messages: render their cards full-width with no label or tint.
  if (isTool) {
    if (!message.componentData) return null;
    return (
      <div className="chat-message-in" style={{ padding: '4px 0' }}>
        <ChatComponentRenderer componentData={message.componentData} />
      </div>
    );
  }

  const body = (
    <>
      {message.content ? (
        <div style={{ wordBreak: 'break-word' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      ) : (
        <Text size="sm" c="dimmed">
          Empty message
        </Text>
      )}
      {message.componentData?.type === 'attached-notes' ? (
        <Box mt={8}>
          <AttachedNoteChips notes={message.componentData.data} />
        </Box>
      ) : (
        message.componentData && (
          <ChatComponentRenderer componentData={message.componentData} />
        )
      )}
    </>
  );

  return (
    <div className="chat-message-in group" style={{ position: 'relative', padding: '8px 0' }}>
      {/* Floating hover actions */}
      <div
        className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          zIndex: 2,
          borderRadius: 8,
          padding: 2,
          background: 'var(--mantine-color-body)',
          border: '1px solid var(--mantine-color-default-border)',
          boxShadow: 'var(--mantine-shadow-sm)',
        }}
      >
        <MessageActions content={message.content} onRegenerate={onRegenerate} />
      </div>

      {isUser ? (
        <div style={{ paddingRight: 56 }}>
          <RoleLabel isUser />
          {body}
        </div>
      ) : (
        <Box
          style={{
            background: 'var(--chat-assistant-tint)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 14,
            padding: '12px 16px',
          }}
        >
          <RoleLabel isUser={false} />
          {body}
        </Box>
      )}
    </div>
  );
};
