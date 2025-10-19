import { Paper, Stack, Group, Title, Divider } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { PasswordForm } from '@/forms/settings';
import { User } from '@/types';

interface PasswordSectionProps {
  user?: User;
  onSuccess?: () => void;
}

export function PasswordSection({ user, onSuccess }: PasswordSectionProps) {
  return (
    <Paper shadow="sm" p="xl" radius="md">
      <Stack gap="lg">
        <Group gap="xs">
          <IconLock size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Title order={3}>Change Password</Title>
        </Group>
        
        <Divider />

        <PasswordForm user={user} onSuccess={onSuccess} />
      </Stack>
    </Paper>
  );
}


