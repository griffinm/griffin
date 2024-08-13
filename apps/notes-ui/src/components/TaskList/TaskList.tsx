import { Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TaskItem } from "./TaskItem";
import { useTasks } from "../../providers/TaskProvider";

export function TaskList() {
  const navigate = useNavigate();
  const { tasks } = useTasks();

  const renderHeading = () => {
    return (
      <div>
        <div className="p-2 flex items-center justify-between">
          <Typography variant='body1'>Tasks</Typography>
          <Button
            size='small'
            variant='outlined'
            onClick={() => navigate('/tasks/new')}
          >
            New
          </Button>
        </div>
        <div>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderHeading()}
    </div>
  )
}