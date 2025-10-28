import { TaskPriority } from "@/types/task";
import classnames from 'classnames';

export function Priority({ priority }: { priority: TaskPriority }) {
  const classes = classnames('px-2 py-1 flex rounded-full items-center justify-center', {
    'bg-red-500': priority === TaskPriority.HIGH,
    'bg-yellow-500': priority === TaskPriority.MEDIUM,
    'bg-green-500': priority === TaskPriority.LOW,
  });

  return (
    <div className={classes}>
      <span className="text-xs text-white font-bold">{priority.toUpperCase()}</span>
    </div>
  )
}