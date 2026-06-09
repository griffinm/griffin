import { Box } from '@mantine/core';
import { AssistantMark } from './AssistantMark';

/**
 * Assistant "thinking" state: the signature mark pulses above a sweeping
 * aurora shimmer line, matching the bubbleless assistant turn styling.
 */
export const TypingIndicator = () => (
  <div className="chat-message-in" style={{ padding: '8px 0' }}>
    <Box
      style={{
        background: 'var(--chat-assistant-tint)',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 14,
        padding: '12px 16px',
      }}
    >
      <div
        className="chat-mono"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: 'var(--mantine-color-dimmed)',
        }}
      >
        <AssistantMark size={13} pulsing />
        <span>Assistant</span>
        <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, opacity: 0.8 }}>
          · thinking
        </span>
      </div>
      <div
        className="chat-shimmer"
        style={{ height: 3, width: '42%', borderRadius: 2, opacity: 0.75 }}
      />
    </Box>
  </div>
);
