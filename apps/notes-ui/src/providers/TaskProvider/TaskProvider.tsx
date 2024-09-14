import { Task } from "@prisma/client";
import { createContext, useState, useEffect } from "react";
import { 
  fetchAllTasks as fetchAllTasksApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  searchTasks as searchTasksApi,
  FetchTasksProps,
} from "../../utils/api";
import { useContext } from "react";
import { CreateOrUpdateTaskProps, TaskListResponse } from "../../utils/api";
import { useUser } from "../UserProvider";

interface Props {
  children: React.ReactNode;
}

interface TaskProps {
  loading: boolean;
  createTask: (task: CreateOrUpdateTaskProps) => void;
  updateTask: (task: CreateOrUpdateTaskProps, id: string) => void;
  fetchTasks: () => void;
  showNewTaskModal: (task?: Task) => void;
  onModalClose: () => void;
  modalOpen: boolean;
  taskToEdit?: Task;
  sidebarTasks: Task[];
  taskPageTasks: TaskListResponse;
  fetchTasksForTaskPage: (props: FetchTasksProps) => void;
  deleteTask: (task: Task) => void;
}

export const TasksContext = createContext<TaskProps>({
  loading: false,
  createTask: () => {},
  updateTask: () => {},
  fetchTasks: () => {},
  deleteTask: () => {},
  showNewTaskModal: () => {},
  onModalClose: () => {},
  modalOpen: false,
  taskToEdit: undefined,
  sidebarTasks: [],
  taskPageTasks: {
    data: [],
    page: 1,
    resultsPerPage: 10,
    totalPages: 0,
    totalRecords: 0,
  },
  fetchTasksForTaskPage: () => {},
});

export function TaskProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [sidebarTasks, setSidebarTasks] = useState<Task[]>([]);
  const [taskPageTasks, setTaskPageTasks] = useState<TaskListResponse>({
    data: [],
    page: 1,
    resultsPerPage: 10,
    totalPages: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    const fetchSidebarTasks = async () => {
      if (!user) return;
      const resp = await fetchTasks(1, 10);
      
      setSidebarTasks(orderTasks(resp.data));
    }
    fetchSidebarTasks();
  }, [user]);

  const fetchTasksForTaskPage = async ({
    page,
    resultsPerPage,
    search,
  }: FetchTasksProps) => {
    if (!user) return;
    const response = await searchTasksApi({
      page,
      resultsPerPage,
      search,
    });
    setTaskPageTasks(response.data);
  }

  const orderTasks = (tasks: Task[]) => {
    return tasks.sort((a, b) => {
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
    });
  }

  const fetchTasks = async (page?: number, resultsPerPage?: number): Promise<TaskListResponse> => {
    const response = await fetchAllTasksApi(page, resultsPerPage);

    return response.data;
  };

  const createTask = async (task: CreateOrUpdateTaskProps) => {
    setModalOpen(false);
    const response = await createTaskApi(task);
    setTasks([...tasks, response.data]);
    
    const tmpSidebarTasks = [response.data, ...sidebarTasks];
    if (tmpSidebarTasks.length > 10) {
      tmpSidebarTasks.pop();
    }
    setSidebarTasks(tmpSidebarTasks);

    // The task page is going to have to do this itself
  };

  const updateTask = async (task: CreateOrUpdateTaskProps, id: string) => {
    const response = await updateTaskApi(id, task)
    setTasks(tasks.map((t) => (t.id === id ? response.data : t)));

    if (sidebarTasks.some((t) => t.id === id)) {
      setSidebarTasks(sidebarTasks.map((t) => (t.id === id ? response.data : t)));
    }

    if (taskPageTasks.data.some((t) => t.id === id)) {
      setTaskPageTasks({
        ...taskPageTasks,
        data: taskPageTasks.data.map((t) => (t.id === id ? response.data : t)),
      });
    }
  };

  const deleteTask = async (task: Task) => {
    await deleteTaskApi(task.id);
    setTasks(tasks.filter((t) => t.id !== task.id));
    setSidebarTasks(sidebarTasks.filter((t) => t.id !== task.id));
    setTaskPageTasks({
      ...taskPageTasks,
      data: taskPageTasks.data.filter((t) => t.id !== task.id),
    });
  };

  return (
    <TasksContext.Provider value={{ 
      loading, 
      createTask, 
      updateTask,
      fetchTasks,
      deleteTask,
      showNewTaskModal: (task?: Task) => {
        if (task?.id) {
          setTaskToEdit(task);
        }
        setModalOpen(true);
      },
      onModalClose: () => {
        setTaskToEdit(undefined);
        setModalOpen(false);
      },
      modalOpen,
      taskToEdit,
      sidebarTasks,
      taskPageTasks,
      fetchTasksForTaskPage,
    }}>
      
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext); 
