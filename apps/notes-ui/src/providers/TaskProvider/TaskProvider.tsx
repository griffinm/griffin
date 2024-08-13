import { Task } from "@prisma/client";
import { createContext, useState, useEffect } from "react";
import { 
  fetchAllTasks as fetchAllTasksApi,
  createTask as createTaskApi,
} from "../../utils/api";

interface Props {
  children: React.ReactNode;
}

interface TaskProps {
  loading: boolean;
  tasks: Task[];
  createTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

export const TasksContext = createContext<TaskProps>({
  loading: false,
  tasks: [],
  createTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
});

export function TaskProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const response = await fetchAllTasksApi();
    setTasks(response.data);
    setLoading(false);
  };

  const createTask = async (task: Task) => {
    const response = await createTaskApi(task);
    setTasks([...tasks, response.data]);
  };

  const updateTask = async (task: Task) => {
    const response = await updateTaskApi(task);
    setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
  };

  const deleteTask = async (taskId: string) => {
    const response = await deleteTaskApi(taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <TasksContext.Provider value={{ 
      loading, 
      tasks, 
      createTask, 
      updateTask,
      deleteTask,
    }}>
      {children}
    </TasksContext.Provider>
  );
}