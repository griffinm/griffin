import { 
  Button,
  Checkbox,
  Chip,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Task, TaskPriority } from "@prisma/client";
import classnames from "classnames";
import { Delete, Edit } from "@mui/icons-material";
import { priorityColors } from "../TaskPriorityChip/TaskPriortityChip";

interface TaskRowProps {
  task: Task;
  onUpdateTask: (updates: { completedAt: Date | null }, taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function TaskRow({ task, onUpdateTask, onEditTask, onDeleteTask }: TaskRowProps) {
  const titleClasses = classnames({
    "line-through": !!task.completedAt,
  });

  const renderPriority = (priority: TaskPriority) => {
    return (
      <Chip 
        size="small" 
        label={priority} 
        color="primary"
        sx={{
          backgroundColor: priorityColors[priority],
          color: '#FFF',
        }}
      />
    )
  }

  return (
    <TableRow key={task.id}>
      <TableCell>
        <Checkbox
          checked={!!task.completedAt}
          onChange={(e) => {
            if (e.target.checked) {
              onUpdateTask({ completedAt: new Date() }, task.id);
            } else {
              onUpdateTask({ completedAt: null }, task.id);
            }
          }}
        />
      </TableCell>
      <TableCell>
        <div>
          <span className={titleClasses}>
            {task.title}
          </span>
        </div>
        <div className="mt-2">
          {renderPriority(task.priority)}
        </div>
      </TableCell>
      <TableCell>
        {task.dueDate && (
          <>
            <div>
              {format(new Date(task.dueDate), "M/d/yy")}
            </div>
            <div>
              <Typography variant="caption">
                {formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })}
              </Typography>
            </div>
          </>
        )}
      </TableCell>
      <TableCell>
        <Button size="small" onClick={() => onEditTask(task)}>
          <Edit />
        </Button>
        <Button size="small" onClick={() => onDeleteTask(task)}>
          <Delete />
        </Button>
      </TableCell>
    </TableRow>
  );
}

