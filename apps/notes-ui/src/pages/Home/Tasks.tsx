import { Card, CardHeader, Button, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { searchTasks } from "../../utils/api/taskClient";
import { Task, TaskPriority } from "@prisma/client";
import { Loading } from "../../components/Loading";
import { Typography } from "@mui/material";
import { formatDistanceStrict } from "date-fns";
import { useTasks } from "../../providers/TaskProvider";
import { useNavigate } from "react-router-dom";
import { urls } from "../../utils/urls";
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import { priorityColors } from "../../components/TaskForm/PrioritySelect";

export function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNewTaskModal } = useTasks();

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await searchTasks({ completed: 'OnlyNotCompleted', page: 1, resultsPerPage: 10 });
      setTasks(response.data.data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

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
    <Card>
      <CardHeader
        title="Tasks"
        action={
          <div className="flex gap-2">
            <Button variant="outlined" onClick={() => navigate(urls.tasks)} startIcon={<ListIcon />}>View All</Button>
            <Button
              variant="outlined"
              onClick={() => showNewTaskModal()}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </div>
        }
      />
      {loading && <Loading />}
      {!loading && tasks.length === 0 && (
        <div className="p-3 text-center">
          <Typography variant="body1">No tasks</Typography>
        </div>
      )}
      {tasks.map((task) => (
        <div key={task.id} className="border-t border-slate-700">
          <div className="p-3 flex justify-between">
            <div>
              <Typography variant="body1">{task.title}</Typography>
              {renderPriority(task.priority)}
              {task.dueDate && (
                <Typography variant="caption" sx={{ pl: 2}}>
                  Due {formatDistanceStrict(task.dueDate, new Date(), { addSuffix: true })}
                </Typography>
              )}
            </div>
            <Button onClick={() => showNewTaskModal(task)}>
              View
            </Button>
          </div>
        </div>
      ))}
    </Card>
  )
}
