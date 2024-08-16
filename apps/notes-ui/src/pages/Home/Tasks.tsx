import { Card, CardHeader, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { searchTasks } from "../../utils/api/taskClient";
import { Task } from "@prisma/client";
import { Loading } from "../../components/Loading";
import { Typography } from "@mui/material";
import { formatDistanceStrict } from "date-fns";
import { Link } from "react-router-dom";
import { urls } from "../../utils/urls";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await searchTasks({});
      setTasks(response.data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <Card>
      <CardHeader title="Tasks" />
      {loading && <Loading />}
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
            <Button component={Link} to={urls.task(task.id)}>
              View
            </Button>
          </div>
        </div>
      ))}
    </Card>
  )
}