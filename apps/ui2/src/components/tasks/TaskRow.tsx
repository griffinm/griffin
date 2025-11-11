import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { HtmlPreview } from '@/components/HtmlPreview';
import { DueDate } from "./DueDate";
import { Group, Pill } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

export function TaskRow({ 
  task,
  setActiveTask,
  activeTask,
}: {
  task: Task;
  setActiveTask: (task: Task | null) => void;
  activeTask: Task | null;
}) {
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: newStatus,
      });

      notifications.show({
        title: 'Success',
        message: 'Task status updated successfully',
        color: 'green',
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating task status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task status',
        color: 'red',
      });
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: newPriority,
        status: task.status,
      });

      notifications.show({
        title: 'Success',
        message: 'Task priority updated successfully',
        color: 'green',
      });

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating task priority:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task priority',
        color: 'red',
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 border border-gray-200 p-2 hover:bg-gray-50 transition-all duration-100 rounded-md shadow-md" onClick={() => setActiveTask(task)}>
      <div className="flex flex-row items-center">
        <div className="w-1/3">
          <h2 className="text-sm text-gray-700 font-bold">{task.title}</h2>
        </div>
        <div className="flex w-1/3 justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <TaskStatusBadge status={task.status} onChange={handleStatusChange} />
          <TaskPriorityBadge priority={task.priority} onChange={handlePriorityChange} />
        </div>
        <div className="w-1/3">
          <DueDate dueDate={task.dueDate} />
        </div>
      </div>
      
      <HtmlPreview html={task.description || ''} maxHeight={true} />
      
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <Group gap="xs" className="mt-1">
          {task.tags.map(tag => {
            const colors = getTagColors(tag.color);
            return (
              <Pill 
                key={tag.id} 
                size="xs"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                {tag.name}
              </Pill>
            );
          })}
        </Group>
      )}
    </div>
  )
}