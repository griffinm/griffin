import { QuestionResult } from '@/types/search';

interface QuestionSearchResultCardProps {
  result: QuestionResult;
  onClick: () => void;
}

export function QuestionSearchResultCard({
  result,
  onClick,
}: QuestionSearchResultCardProps) {
  const isAnswered = result.answer && result.answer !== '';

  return (
    <div
      onClick={onClick}
      className="p-3 bg-[var(--mantine-color-body)] border border-[var(--mantine-color-gray-3)] rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[var(--mantine-color-default-hover)]"
    >
      {result.snippet ? (
        <p
          className="text-sm line-clamp-2 mb-2 [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded"
          dangerouslySetInnerHTML={{ __html: result.snippet }}
        />
      ) : (
        <p className="text-sm line-clamp-2 mb-2">
          {result.question.length > 80
            ? `${result.question.substring(0, 80)}...`
            : result.question}
        </p>
      )}

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
        {result.matchedField && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Matched in {result.matchedField}
          </span>
        )}
      </div>
    </div>
  );
}
