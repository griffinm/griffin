import { Task } from "@prisma/client";
import { endOfDay, addDays, endOfWeek } from "date-fns";
type GroupHeader = 'Overdue' | 'Today' | 'Tomorrow' | 'This Week' | 'Next Week' | 'Later';

export interface TaskGroup {
  header: GroupHeader;
  tasks: Task[];
}

export function getTasksByDay(tasks: Task[]) {
  const today = endOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const thisWeek = endOfWeek(today);
  const nextWeek = addDays(endOfWeek(today), 7);
  const later = addDays(nextWeek, 30);
  const overdue = tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() < today.getTime());

  const groups: TaskGroup[] = [
    {
      header: 'Overdue',
      tasks: overdue,
    },
    {
      header: 'Today',
      tasks: tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() === today.getTime()),
    },
    {
      header: 'Tomorrow',
      tasks: tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() === tomorrow.getTime()),
    },
    {
      header: 'This Week',
      tasks: tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() >= today.getTime() && new Date(task.dueDate).getTime() <= thisWeek.getTime()),
    },
    {
      header: 'Next Week',
      tasks: tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() >= nextWeek.getTime() && new Date(task.dueDate).getTime() <= later.getTime()),
    },
    {
      header: 'Later',
      tasks: tasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() > later.getTime()),
    },
  ];

  return groups;
}
