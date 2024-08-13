import { useEffect, useState } from "react";
import { Typography, Divider } from "@mui/material";
import { TaskForm } from "../../components/TaskForm";
import { useTasks } from "../../providers/TaskProvider";
import { useParams } from "react-router-dom";
import { fetchTask } from "../../utils/api";
import { Task } from "@prisma/client";

export function NewTaskPage() {
  const { 
    createTask,
    setCurrentTask: setCurrentTaskFromProvider,
    updateTask,
  } = useTasks();
  const { taskId } = useParams();
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      fetchTask(taskId).then((response) => {
        setLoading(false);
        setCurrentTask(response.data);
        setCurrentTaskFromProvider(response.data);
      });
    } else {
      setLoading(false);
      setCurrentTask(undefined);
      setCurrentTaskFromProvider(undefined);
    }
  }, [taskId]);

  const renderForm = () => {
    console.log("TaskID", taskId);
    if (taskId) {
      return <TaskForm onSubmit={(task) => updateTask(task, taskId)} initialValues={currentTask} />
    }
    return <TaskForm onSubmit={createTask} initialValues={undefined} />
  }

  return (
    <div>
      <div className="p-3">
        <Typography variant="h4">{taskId ? 'Edit' : 'New'} Task</Typography>
      </div>
      <Divider />
      <div className="p-3 max-w-md">
        {renderForm()}
      </div>
    </div>
  )
}