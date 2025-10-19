import { Paper, Stack, Group, Title, Divider } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { ProfileForm } from '@/forms/settings';
import { User } from '@/types';

interface ProfileSectionProps {
  user?: User;
  onSuccess?: () => void;
}

export function ProfileSection({ user, onSuccess }: ProfileSectionProps) {
  return (
    <Paper shadow="sm" p="xl" radius="md">
      <Stack gap="lg">
        <Group gap="xs">
          <IconUser size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Title order={3}>Profile Information</Title>
        </Group>
        
        <Divider />

        <ProfileForm user={user} onSuccess={onSuccess} />
      </Stack>
    </Paper>
  );
}


