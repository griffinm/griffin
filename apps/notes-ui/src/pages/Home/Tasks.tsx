import { Card, CardHeader, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { searchTasks } from "../../utils/api/taskClient";
import { Task } from "@prisma/client";
import { Loading } from "../../components/Loading";
import { Typography } from "@mui/material";
import { formatDistanceStrict } from "date-fns";
import { useTasks } from "../../providers/TaskProvider";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNewTaskModal } = useTasks();

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await searchTasks({ completed: false, page: 1, resultsPerPage: 10 });
      setTasks(response.data.data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <Card>
      <CardHeader
        title="Tasks"
        action={
          <Button variant="outlined" onClick={() => showNewTaskModal()}>Add Task</Button>
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
              {task.dueDate && (
                <Typography variant="caption">
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
