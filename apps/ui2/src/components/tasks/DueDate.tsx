import {
  format as formatDate,
  formatDistanceToNow as formatDistanceToNowDate,
  isPast,
} from 'date-fns';

export function DueDate({ dueDate }: { dueDate?: Date | string }) {
  if (!dueDate) return null;

  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const distance = formatDistanceToNowDate(date);
  const formattedDate = formatDate(date, 'MM/dd/yyyy');
  const overDue = isPast(date);

  const distanceText = () => {
    if (overDue) {
      return `Due ${distance} ago`;
    }
    return `Due in ${distance}`;
  }

  return (
    <div className="flex flex-col text-xs text-gray-500 items-end">
      <span>{formattedDate}</span>
      <span>{distanceText()}</span>
    </div>
  )
}