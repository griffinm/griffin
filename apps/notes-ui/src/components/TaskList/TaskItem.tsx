import { Task } from "@prisma/client";
import { format, differenceInDays } from "date-fns";
import { 
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface Props {
  task: Task
  onToggleComplete: (task: Task) => void
}

export function TaskItem({
  task,
  onToggleComplete,
  }: Props) {
  const navigate = useNavigate();
  
  const renderContent = () => {
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
      <ListItemText
        onClick={() => navigate(`/tasks/${task.id}`)}
        primary={
          <span className={task.completedAt ? "line-through" : ""}>
            {task.title}
          </span>
        }
        secondary={`${formattedDueDate} (${distanceText})`}
      />
    )
  }

  return (
    <ListItemButton sx={{ pl: 2, py: 0 }}>
      <ListItemIcon>
      <Checkbox
        edge="start"
        checked={!!task.completedAt}
        tabIndex={-1}
        disableRipple
        onChange={() => onToggleComplete(task)}
      />
      </ListItemIcon>
      {renderContent()}
    </ListItemButton>
  )
}