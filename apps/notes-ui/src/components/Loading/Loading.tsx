import CircularProgress from '@mui/material/CircularProgress';

export function Loading() {
  return (
    <div className="flex justify-center items-center">
      <CircularProgress />
    </div>
  )
}