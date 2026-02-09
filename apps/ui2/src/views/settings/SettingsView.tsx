import { useContext } from 'react';
import { Container, Title, Stack, Text } from '@mantine/core';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { ProfileSection, PasswordSection, AppearanceSection } from '@/components/settings';

export function SettingsView() {
  const { user, refetch } = useContext(UserContext);

  const handleProfileSuccess = () => {
    refetch();
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Settings</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Manage your account settings and preferences
          </Text>
        </div>

        {/* Appearance */}
        <AppearanceSection />

        {/* Profile Settings */}
        <ProfileSection user={user} onSuccess={handleProfileSuccess} />

        {/* Password Settings */}
        <PasswordSection user={user} />
      </Stack>
    </Container>
  );
}


