import { Box, Group } from '@mantine/core';
import { IconRobot } from '@tabler/icons-react';

const typingDotStyle = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#868e96',
};

export const TypingIndicator = () => {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 12,
      }}
    >
      <Group gap="xs">
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
          }}
        >
          <IconRobot size={18} />
        </Box>
        <Box
          style={{
            backgroundColor: '#f1f3f5',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #dee2e6',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}
        >
          <Box
            style={{
              ...typingDotStyle,
              animation: 'typingBounce 1.4s ease-in-out infinite',
            }}
          />
          <Box
            style={{
              ...typingDotStyle,
              animation: 'typingBounce 1.4s ease-in-out 0.2s infinite',
            }}
          />
          <Box
            style={{
              ...typingDotStyle,
              animation: 'typingBounce 1.4s ease-in-out 0.4s infinite',
            }}
          />
        </Box>
      </Group>
      <style>
        {`
          @keyframes typingBounce {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-4px);
            }
          }
        `}
      </style>
    </Box>
  );
};
