import { Task } from "@prisma/client";
import { format, differenceInDays } from "date-fns";
import { Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface Props {
  task: Task
}

export function TaskItem({
  task,
  }: Props) {
  const navigate = useNavigate();
  
  const renderDueDate = () => {
    if (!task.dueDate) {
      return null;
    }
    const formattedDueDate = format(task.dueDate, 'M/dd');
    const distance = differenceInDays(task.dueDate, new Date());
    let distanceText = '';

    if (distance === 1) {
      distanceText = 'Tomorrow';
    } else if (distance === 0) {
      distanceText = 'Today';
    } else if (distance > 1) {
      distanceText = `${distance} days`;
    } else if (distance < 0) {
      distanceText = `${Math.abs(distance)} days ago`;
    }

    return (
      <div className="flex flex-row justify-between">
        <div>
          Due: {formattedDueDate}
        </div>
        <div className="italic">
          {distanceText}
        </div>
      </div>
    )
  }

  return (
    <div className="cursor-pointer hover:bg-gray-100 transition-all" onClick={() => navigate(`/tasks/${task.id}`)}>
      <Divider />
      <div className="p-1 text-lg">
        {task.title}
      </div>
      <div className="p-1">
        {renderDueDate()}
      </div>
    </div>
  )
}