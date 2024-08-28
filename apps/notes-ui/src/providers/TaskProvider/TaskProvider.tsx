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
import { useUser } from "../UserProvider";

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
  fetchTasks: () => void;
}

export const TasksContext = createContext<TaskProps>({
  loading: false,
  tasks: [],
  createTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
  setCurrentTask: () => {},
  fetchTasks: () => {},
});

export function TaskProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
 
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const response = await fetchAllTasksApi();

    const orderedTasks = response.data.sort((a, b) => {
      const aDate = new Date(a.dueDate || 0);
      const bDate = new Date(b.dueDate || 0);
      // First, sort by completion status
      if (a.completedAt && !b.completedAt) return 1;
      if (!a.completedAt && b.completedAt) return -1;
      
      // If completion status is the same, sort by due date
      if (aDate && bDate) {
        return aDate.getTime() - bDate.getTime();
      }
      
      // If one task has a due date and the other doesn't, prioritize the one with a due date
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      
      // If neither has a due date, maintain original order
      return 0;
    });

    setTasks(orderedTasks);
    setLoading(false);
  };

  const createTask = async (task: CreateOrUpdateTaskProps) => {
    const response = await createTaskApi(task);
    setTasks([...tasks, response.data]);
  };

  const updateTask = async (task: CreateOrUpdateTaskProps, id: string) => {
    const response = await updateTaskApi(id, task)
    setTasks(tasks.map((t) => (t.id === id ? response.data : t)));
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
      fetchTasks,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext); 
