import {
  Paper,
  Stack,
  Group,
  Title,
  Divider,
  Text,
  Button,
  Badge,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrandGoogleFilled, IconPlugConnected } from '@tabler/icons-react';
import {
  useGoogleStatus,
  useDisconnectGoogle,
  connectGoogle,
} from '@/hooks/useGoogleConnection';

export function IntegrationsSection() {
  const { data: status, isLoading } = useGoogleStatus();
  const disconnect = useDisconnectGoogle();

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      notifications.show({
        title: 'Disconnected',
        message: 'Gmail has been disconnected.',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to disconnect Gmail.',
        color: 'red',
      });
    }
  };

  return (
    <Paper shadow="sm" p="xl" radius="md">
      <Stack gap="lg">
        <Group gap="xs">
          <IconPlugConnected
            size={24}
            style={{ color: 'var(--mantine-color-blue-6)' }}
          />
          <Title order={3}>Integrations</Title>
        </Group>

        <Divider />

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <IconBrandGoogleFilled size={28} />
            <div>
              <Group gap="xs">
                <Text fw={600}>Gmail</Text>
                {status?.connected && (
                  <Badge color="green" variant="light">
                    Connected
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed" mt={2}>
                {status?.connected
                  ? `Connected as ${status.email}. The AI chat can search and read your email.`
                  : 'Connect your Gmail so the AI chat can search and read your email (read-only).'}
              </Text>
            </div>
          </Group>

          {isLoading ? (
            <Loader size="sm" />
          ) : status?.connected ? (
            <Button
              variant="default"
              color="red"
              onClick={handleDisconnect}
              loading={disconnect.isPending}
            >
              Disconnect
            </Button>
          ) : (
            <Button onClick={connectGoogle}>Connect Gmail</Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
