import { Task } from "@prisma/client";
import { getTasksByDay, TaskGroup } from "./utils";
import { Checkbox, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskPriorityChip } from "../../components/tasks/TaskPriorityChip/TaskPriortityChip";
import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { format as formatDate, formatDistance } from 'date-fns';
import { useTasks } from "../../providers/TaskProvider";

interface props {
  tasks: Task[];
}

export function ByDay({ tasks }: props) {
  const groups = getTasksByDay(tasks);
  
  const renderGroup = (group: TaskGroup) => {
    return (
      <Accordion key={group.header}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{group.header} ({group.tasks.length})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <div>
            {group.tasks.map(task => (
              <AccordionTask key={task.id} task={task} />
            ))}
          </div>
        </AccordionDetails>
      </Accordion>
  );
};

return (
    <div>
      {groups.map(group => renderGroup(group) )}
    </div>
  );
}

export function AccordionTask({ task }: { task: Task }) {
  const { updateTask } = useTasks();

  const onUpdateTask = (task: Task) => {
    updateTask(
      { completedAt: task.completedAt === null ? new Date() : null },
      task.id
    );
  }

  return (
    <div
      className="border-b border-slate-700 px-4 py-2"
      key={task.id}
    >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="flex flex-row gap-5">
            <Checkbox
              checked={task.completedAt !== null}
              onChange={() => onUpdateTask(task)}
            />

            <div>
              {task.title}
              <div>
                <TaskPriorityChip priority={task.priority} />
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <Typography variant="body2">
              {task.description?.substring(0, 100) || 'No description'}
            </Typography>
          </div>

          <div className="hidden md:block">
            <Typography variant="body1">
              Due: {task.dueDate ? formatDate(task.dueDate, 'MM/dd/yyyy') : 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {task.dueDate ? formatDistance(task.dueDate, new Date(), { addSuffix: true }) : 'N/A'}
            </Typography>
          </div>
        </div>
    </div>
  );
}

