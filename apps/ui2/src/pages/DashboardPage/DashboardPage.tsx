import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Skeleton, 
  Center,
  SimpleGrid,
  Paper,
} from '@mantine/core';
import { 
  IconNote, 
  IconChecklist, 
  IconHelp,
  IconSparkles,
} from '@tabler/icons-react';
import { useRecentNotes } from '@/hooks/useNotes';
import { useTasks } from '@/hooks/useTasks';
import { useQuestions } from '@/hooks/useQuestions';
import { ActionBar } from '@/components/dashboard/ActionBar';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { RecentNoteCard } from '@/components/dashboard/RecentNoteCard';
import { UpcomingTaskCard } from '@/components/dashboard/UpcomingTaskCard';
import { UnansweredQuestionCard } from '@/components/dashboard/UnansweredQuestionCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskStatus, SortBy, SortOrder } from '@/types/task';

export function DashboardPage() {
  const navigate = useNavigate();
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Fetch data
  const { data: recentNotes, isLoading: notesLoading } = useRecentNotes(6);
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
    resultsPerPage: 50,
  });
  const { data: questions, isLoading: questionsLoading } = useQuestions(false);

  // Filter and process tasks
  const upcomingTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data
      .filter(task => 
        task.status === TaskStatus.TODO || 
        task.status === TaskStatus.IN_PROGRESS
      )
      .slice(0, 10);
  }, [tasksData]);

  // Limit questions to 10
  const unansweredQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.slice(0, 10);
  }, [questions]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group gap="xs" mb="xs">
            <IconSparkles size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={1}>{getGreeting()}</Title>
          </Group>
          <Text size="lg" c="dimmed">
            Here's what's happening with your notes and tasks
          </Text>
        </div>

        {/* Action Bar */}
        <ActionBar onCreateTask={() => setTaskModalOpen(true)} />

        {/* Recent Notes Section */}
        <DashboardSection
          title="Recent Notes"
          icon={<IconNote size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />}
          count={recentNotes?.length}
          onViewAll={() => navigate('/notebooks')}
          background="linear-gradient(135deg, rgba(34, 139, 230, 0.06) 0%, rgba(34, 184, 207, 0.06) 100%)"
        >
          {notesLoading ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} height={120} radius="md" />
              ))}
            </SimpleGrid>
          ) : recentNotes && recentNotes.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {recentNotes.map(note => (
                <RecentNoteCard key={note.id} note={note} />
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconNote size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed">No recent notes</Text>
                <Text size="sm" c="dimmed">Create your first note to get started</Text>
              </Stack>
            </Center>
          )}
        </DashboardSection>

        {/* Upcoming Tasks Section */}
        <DashboardSection
          title="Upcoming Tasks"
          icon={<IconChecklist size={24} style={{ color: 'var(--mantine-color-grape-6)' }} />}
          count={upcomingTasks.length}
          onViewAll={() => navigate('/tasks')}
          background="linear-gradient(135deg, rgba(174, 62, 201, 0.06) 0%, rgba(236, 64, 122, 0.06) 100%)"
        >
          {tasksLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height={100} radius="md" />
              ))}
            </Stack>
          ) : upcomingTasks.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {upcomingTasks.map(task => (
                <UpcomingTaskCard 
                  key={task.id} 
                  task={task}
                  onClick={() => navigate('/tasks')}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconChecklist size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed">No upcoming tasks</Text>
                <Text size="sm" c="dimmed">All caught up! Create a task to stay organized</Text>
              </Stack>
            </Center>
          )}
        </DashboardSection>

        {/* Unanswered Questions Section */}
        <DashboardSection
          title="Unanswered Questions"
          icon={<IconHelp size={24} style={{ color: 'var(--mantine-color-orange-6)' }} />}
          count={unansweredQuestions.length}
          background="linear-gradient(135deg, rgba(253, 126, 20, 0.06) 0%, rgba(251, 146, 60, 0.06) 100%)"
        >
          {questionsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height={60} radius="md" />
              ))}
            </Stack>
          ) : unansweredQuestions.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="sm">
              {unansweredQuestions.map(question => (
                <UnansweredQuestionCard key={question.id} question={question} />
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconHelp size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed">No unanswered questions</Text>
                <Text size="sm" c="dimmed">
                  Questions can be added to notes and followed up on later.
                </Text>
              </Stack>
            </Center>
          )}
        </DashboardSection>
      </Stack>

      {/* Task Modal */}
      <TaskModal 
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </Container>
  );
}
