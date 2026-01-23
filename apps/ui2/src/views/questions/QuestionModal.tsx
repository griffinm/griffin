import { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Textarea,
  Button,
  Group,
  Stack,
  Badge,
  Divider,
  Anchor,
} from '@mantine/core';
import { IconQuestionMark, IconCheck, IconExternalLink } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Question } from '@/types/question';
import { updateQuestion } from '@/api/questionsApi';
import { useQueryClient } from '@tanstack/react-query';
import { useOpenNote } from '@/hooks/useOpenNote';

interface QuestionModalProps {
  question: Question | null;
  opened: boolean;
  onClose: () => void;
}

export function QuestionModal({ question, opened, onClose }: QuestionModalProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { openNote } = useOpenNote();

  const isAnswered = question?.answer && question.answer !== '';

  // Reset answer when question changes
  useEffect(() => {
    if (question) {
      setAnswer(question.answer || '');
    }
  }, [question]);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) return;

    setIsSubmitting(true);
    try {
      await updateQuestion(question.noteId, question.id, {
        question: question.question,
        answer: answer.trim(),
      });
      // Invalidate questions cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      onClose();
    } catch (error) {
      console.error('Error updating question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToNote = () => {
    if (question) {
      openNote(question.noteId, question.noteTitle);
      onClose();
    }
  };

  if (!question) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconQuestionMark size={20} />
          <Text fw={600}>Question</Text>
          <Badge
            size="sm"
            color={isAnswered ? 'green' : 'orange'}
            variant="light"
          >
            {isAnswered ? 'Answered' : 'Unanswered'}
          </Badge>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Metadata */}
        <Group gap="xs">
          {question.notebookName && (
            <Badge variant="light" color="gray" size="sm">
              {question.notebookName}
            </Badge>
          )}
          {question.noteTitle && (
            <Anchor
              size="sm"
              c="dimmed"
              onClick={handleGoToNote}
              style={{ cursor: 'pointer' }}
            >
              {question.noteTitle} <IconExternalLink size={12} style={{ verticalAlign: 'middle' }} />
            </Anchor>
          )}
        </Group>

        <Text size="xs" c="dimmed">
          Created {formatDistanceToNowStrict(new Date(question.createdAt), { addSuffix: true })}
        </Text>

        <Divider />

        {/* Question */}
        <div>
          <Text size="sm" fw={600} mb="xs">
            Question:
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {question.question}
          </Text>
        </div>

        <Divider />

        {/* Answer */}
        <div>
          <Text size="sm" fw={600} mb="xs">
            Answer:
          </Text>
          <Textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            minRows={4}
            autosize
            maxRows={10}
          />
        </div>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!answer.trim()}
            leftSection={<IconCheck size={16} />}
          >
            {isAnswered ? 'Update Answer' : 'Save Answer'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
