import { Alert } from "@mui/material";

interface Props {
  errors: string[];
}

export function ErrorDisplay({ errors }: Props) {
  if (errors.length === 0) return null;
  
  return (
    <Alert severity="error">
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
}
