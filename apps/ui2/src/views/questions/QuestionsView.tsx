import { useState, useMemo } from 'react';
import {
  Title,
  SegmentedControl,
  Select,
  Text,
  Skeleton,
} from '@mantine/core';
import { useQuestions } from '@/hooks/useQuestions';
import { Question } from '@/types/question';
import { QuestionCard } from './QuestionCard';
import { QuestionModal } from './QuestionModal';
import { ActionPanel } from '@/components/ActionPanel';
import { Stat } from '@/components/Stat/Stat';

type FilterValue = 'all' | 'unanswered' | 'answered';
type SortValue = 'newest' | 'oldest';

export function QuestionsView() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [sort, setSort] = useState<SortValue>('oldest');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Fetch all questions (includeAnswered=true) and filter client-side
  const { data: questions, isLoading } = useQuestions(true);

  const filteredAndSortedQuestions = useMemo(() => {
    if (!questions) return [];

    // Filter
    let filtered = questions;
    if (filter === 'unanswered') {
      filtered = questions.filter((q) => !q.answer || q.answer === '');
    } else if (filter === 'answered') {
      filtered = questions.filter((q) => q.answer && q.answer !== '');
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [questions, filter, sort]);

  const answeredQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter((q) => q.answer && q.answer !== '');
  }, [questions]);

  const unansweredQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter((q) => !q.answer || q.answer === '');
  }, [questions]);

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setSelectedQuestion(null);
  };

  return (
    <div className="p-5 flex flex-col  gap-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
        <div className="flex flex-row gap-2">
          <Title order={2}>Questions</Title>
        </div>

        <SegmentedControl
            value={filter}
            onChange={(value) => setFilter(value as FilterValue)}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Unanswered', value: 'unanswered' },
              { label: 'Answered', value: 'answered' },
            ]}
          />

          <Select
            value={sort}
            onChange={(value) => setSort(value as SortValue)}
            data={[
              { label: 'Oldest first', value: 'oldest' },
              { label: 'Newest first', value: 'newest' },
            ]}
            style={{ width: 150 }}
          />
      </div>

      <ActionPanel>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-row gap-4 sm:gap-8 justify-between items-center md:justify-start sm:items-center">
            <Stat value={questions?.length} label={questions?.length === 1 ? 'Question' : 'Questions'} />
            <Stat value={answeredQuestions.length} label={'Answered'} />
            <Stat value={unansweredQuestions.length} label={'Unanswered'} />
          </div>

          <div>
            Search
          </div>
        </div>
      </ActionPanel>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </div>
      ) : filteredAndSortedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Text c="dimmed">
            {filter === 'all'
              ? 'No questions yet'
              : filter === 'unanswered'
                ? 'No unanswered questions'
                : 'No answered questions'}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onClick={handleQuestionClick}
            />
          ))}
        </div>
      )}

      <QuestionModal
        question={selectedQuestion}
        opened={modalOpened}
        onClose={handleModalClose}
      />
    </div>
  );
}
