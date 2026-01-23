import { Paper } from '@mantine/core';
import { ReactNode } from 'react';

interface ActionPanelProps {
  children: ReactNode;
}

export function ActionPanel({ children }: ActionPanelProps) {
  return (
    <Paper
      shadow="sm"
      p="lg"
      radius="md"
      withBorder
      style={{
        background:
          'linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
      }}
    >
      {children}
    </Paper>
  );
}
