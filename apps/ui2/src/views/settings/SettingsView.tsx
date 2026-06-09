import { useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Title, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { queryKeys } from '@/constants/queryKeys';
import {
  ProfileSection,
  PasswordSection,
  AppearanceSection,
  IntegrationsSection,
} from '@/components/settings';

export function SettingsView() {
  const { user, refetch } = useContext(UserContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const handleProfileSuccess = () => {
    refetch();
  };

  // Handle the redirect back from the Google OAuth flow (?gmail=connected|error)
  useEffect(() => {
    const gmail = searchParams.get('gmail');
    if (!gmail) return;

    if (gmail === 'connected') {
      notifications.show({
        title: 'Gmail connected',
        message: 'The AI chat can now search and read your email.',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.googleStatus() });
    } else if (gmail === 'error') {
      notifications.show({
        title: 'Connection failed',
        message: 'Could not connect Gmail. Please try again.',
        color: 'red',
      });
    }

    // Clear the query param so the toast doesn't re-fire on refresh
    searchParams.delete('gmail');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

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

        {/* Integrations */}
        <IntegrationsSection />
      </Stack>
    </Container>
  );
}
