import { Title, Text, Group, ActionIcon, Paper } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  icon?: ReactNode;
  onViewAll?: () => void;
  children: ReactNode;
  count?: number;
  background?: string;
}

export function DashboardSection({ title, icon, onViewAll, children, count, background }: DashboardSectionProps) {
  return (
    <Paper 
      shadow="sm" 
      p="lg" 
      radius="md" 
      withBorder
      style={background ? { background } : undefined}
    >
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          {icon}
          <Title order={3} size="h4">{title}</Title>
          {count !== undefined && (
            <Text size="sm" c="dimmed">({count})</Text>
          )}
        </Group>
        {onViewAll && (
          <ActionIcon 
            variant="subtle" 
            onClick={onViewAll}
            aria-label="View all"
          >
            <IconArrowRight size={18} />
          </ActionIcon>
        )}
      </Group>
      {children}
    </Paper>
  );
}

