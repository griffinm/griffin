import { Paper, Stack, Group, Title, Divider, SegmentedControl, Text } from '@mantine/core';
import { IconPalette } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';

export function AppearanceSection() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Paper shadow="sm" p="xl" radius="md">
      <Stack gap="lg">
        <Group gap="xs">
          <IconPalette size={24} style={{ color: 'var(--mantine-color-violet-6)' }} />
          <Title order={3}>Appearance</Title>
        </Group>

        <Divider />

        <Stack gap="xs">
          <Text size="sm" fw={500}>Color scheme</Text>
          <Text size="xs" c="dimmed">
            Choose how Griffin looks to you. Select a single theme or sync with your system settings.
          </Text>
          <SegmentedControl
            value={colorScheme}
            onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
            data={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'auto' },
            ]}
            mt="xs"
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
