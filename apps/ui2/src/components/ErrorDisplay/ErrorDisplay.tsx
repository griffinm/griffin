import { Alert } from '@mantine/core';

export function ErrorDisplay({
  errors,
  title,
}: {
  errors: string[];
  title?: string;
}) {
  if (errors.length === 0) return null;
  
  return (
    <Alert color="red" title={title}>
      <ul className="list-disc list-inside">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
}
