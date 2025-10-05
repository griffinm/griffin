import { useState } from 'react'
import { Container, Title, Text, Button, Card, Group, Stack, Badge, Grid, Paper, SimpleGrid, Progress, RingProgress, Center } from '@mantine/core'
import { IconRocket, IconBrandReact, IconBrandVite, IconBrandTailwind, IconTrendingUp, IconUsers, IconShoppingCart, IconCurrencyDollar } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import Layout from './components/Layout'

function App() {
  const [count, setCount] = useState(0)

  const showNotification = () => {
    notifications.show({
      title: 'Hello from Mantine!',
      message: 'This is a notification from your new UI project',
      color: 'blue',
    })
  }

  return (
    <Layout>
      <Container size="xl" p="md">
        <Stack gap="xl">
          {/* Welcome Section */}
          <div>
            <Title order={1} size="h1" className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to UI2 Dashboard
            </Title>
            <Text size="lg" c="dimmed">
              A modern React application built with Vite, Tailwind CSS, and Mantine components
            </Text>
          </div>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    Total Revenue
                  </Text>
                  <Text fw={700} size="xl">
                    $45,231
                  </Text>
                </div>
                <IconCurrencyDollar size={32} className="text-green-500" />
              </Group>
              <Text c="green" size="sm" fw={500} mt="xs">
                +20.1% from last month
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    Users
                  </Text>
                  <Text fw={700} size="xl">
                    2,350
                  </Text>
                </div>
                <IconUsers size={32} className="text-blue-500" />
              </Group>
              <Text c="blue" size="sm" fw={500} mt="xs">
                +15.3% from last month
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    Orders
                  </Text>
                  <Text fw={700} size="xl">
                    1,234
                  </Text>
                </div>
                <IconShoppingCart size={32} className="text-orange-500" />
              </Group>
              <Text c="orange" size="sm" fw={500} mt="xs">
                +8.2% from last month
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    Growth
                  </Text>
                  <Text fw={700} size="xl">
                    12.5%
                  </Text>
                </div>
                <IconTrendingUp size={32} className="text-purple-500" />
              </Group>
              <Text c="purple" size="sm" fw={500} mt="xs">
                +2.4% from last month
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Main Content Grid */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                {/* Tech Stack Cards */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md">Tech Stack</Title>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack align="center" gap="md">
                        <IconBrandReact size={48} className="text-blue-500" />
                        <Text fw={500}>React</Text>
                        <Badge color="blue" variant="light">Frontend</Badge>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack align="center" gap="md">
                        <IconBrandVite size={48} className="text-purple-500" />
                        <Text fw={500}>Vite</Text>
                        <Badge color="purple" variant="light">Build Tool</Badge>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack align="center" gap="md">
                        <IconBrandTailwind size={48} className="text-cyan-500" />
                        <Text fw={500}>Tailwind</Text>
                        <Badge color="cyan" variant="light">Styling</Badge>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Stack align="center" gap="md">
                        <IconRocket size={48} className="text-green-500" />
                        <Text fw={500}>Mantine</Text>
                        <Badge color="green" variant="light">Components</Badge>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Interactive Demo */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md">Interactive Demo</Title>
                  <Stack align="center" gap="lg">
                    <Text size="xl" fw={700} className="text-blue-600">
                      Count: {count}
                    </Text>
                    <Group>
                      <Button 
                        onClick={() => setCount(count + 1)}
                        variant="filled"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Increment
                      </Button>
                      <Button 
                        onClick={() => setCount(count - 1)}
                        variant="outline"
                        color="blue"
                      >
                        Decrement
                      </Button>
                    </Group>
                    <Button 
                      onClick={showNotification}
                      variant="gradient"
                      gradient={{ from: 'purple', to: 'pink' }}
                      leftSection={<IconRocket size={16} />}
                    >
                      Show Notification
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                {/* Progress Card */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md">Progress</Title>
                  <Stack gap="md">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Sales</Text>
                        <Text size="sm" c="dimmed">78%</Text>
                      </Group>
                      <Progress value={78} color="blue" />
                    </div>
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Marketing</Text>
                        <Text size="sm" c="dimmed">45%</Text>
                      </Group>
                      <Progress value={45} color="green" />
                    </div>
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Development</Text>
                        <Text size="sm" c="dimmed">92%</Text>
                      </Group>
                      <Progress value={92} color="orange" />
                    </div>
                  </Stack>
                </Card>

                {/* Ring Progress */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md">Completion</Title>
                  <Center>
                    <RingProgress
                      size={120}
                      thickness={16}
                      sections={[
                        { value: 40, color: 'blue' },
                        { value: 15, color: 'green' },
                        { value: 15, color: 'yellow' },
                      ]}
                      label={
                        <Text ta="center" size="xl" fw={700}>
                          40%
                        </Text>
                      }
                    />
                  </Center>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </Layout>
  )
}

export default App
