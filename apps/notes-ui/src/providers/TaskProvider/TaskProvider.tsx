import { Task } from "@prisma/client";
import { createContext, useState, useEffect } from "react";
import { 
  fetchAllTasks as fetchAllTasksApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from "../../utils/api";
import { useContext } from "react";
import { CreateOrUpdateTaskProps } from "../../utils/api";
interface Props {
  children: React.ReactNode;
}

interface TaskProps {
  loading: boolean;
  tasks: Task[];
  createTask: (task: CreateOrUpdateTaskProps) => void;
  updateTask: (task: CreateOrUpdateTaskProps, id: string) => void;
  deleteTask: (taskId: string) => void;
  currentTask?: Task;
  setCurrentTask: (task?: Task) => void;
}

export const TasksContext = createContext<TaskProps>({
  loading: false,
  tasks: [],
  createTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
  setCurrentTask: () => {},
});

export function TaskProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const response = await fetchAllTasksApi();
    setTasks(response.data);
    setLoading(false);
  };

  const createTask = async (task: CreateOrUpdateTaskProps) => {
    const response = await createTaskApi(task);
    setTasks([...tasks, response.data]);
  };

  const updateTask = async (task: CreateOrUpdateTaskProps, id: string) => {
    const response = await updateTaskApi(id, task)
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
      currentTask,
      setCurrentTask,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext); 