import { formatDistanceToNowStrict } from 'date-fns';
import { Question } from '@/types/question';

interface QuestionCardProps {
  question: Question;
  onClick?: (question: Question) => void;
}

export function QuestionCard({ question, onClick }: QuestionCardProps) {
  const isAnswered = question.answer && question.answer !== '';

  const questionPreview =
    question.question.length > 80
      ? `${question.question.substring(0, 80)}...`
      : question.question;

  const handleClick = () => {
    onClick?.(question);
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 bg-[var(--mantine-color-body)] border border-[var(--mantine-color-gray-3)] rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[var(--mantine-color-default-hover)]"
    >
      <p className="text-sm line-clamp-2 mb-2">
        {questionPreview}
      </p>
      <div className="flex flex-row gap-2 flex-wrap justify-between items-center">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isAnswered
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
          }`}
        >
          {isAnswered ? 'Answered' : 'Unanswered'}
        </span>
        {question.notebookName && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--mantine-color-gray-1)] text-[var(--mantine-color-dimmed)]">
            {question.notebookName}
          </span>
        )}
        <span className="text-xs text-[var(--mantine-color-dimmed)]">
          {formatDistanceToNowStrict(new Date(question.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
