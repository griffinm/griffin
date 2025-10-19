import { Modal } from "@mantine/core";
import { Task } from "@/types/task";
import { TaskForm, TaskFormData } from "@/views/tasks";
import { useMediaQuery } from "@mantine/hooks";
import { theme } from "@/theme";
import { createTask, updateTask } from "@/api/tasksApi";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useTask } from "@/hooks/useTasks";

export function TaskModal({
  task,
  open,
  onClose,
}: {
  task?: Task;
  open: boolean;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints?.sm})`);
  const queryClient = useQueryClient();
  
  // Fetch full task data including statusHistory when editing an existing task
  const { data: fullTask } = useTask(task?.id || '');
  
  // Use fullTask if available (editing), otherwise use the prop task (creating)
  const taskData = fullTask || task;

  const handleSubmit = async (formData: TaskFormData) => {
    try {
      if (taskData?.id) {
        // Update existing task
        await updateTask(taskData.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          priority: formData.priority,
          status: formData.status,
        });
        notifications.show({
          title: 'Success',
          message: 'Task updated successfully',
          color: 'green',
        });
      } else {
        // Create new task
        await createTask({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          priority: formData.priority,
          status: formData.status,
        });
        notifications.show({
          title: 'Success',
          message: 'Task created successfully',
          color: 'green',
        });
      }
      
      // Invalidate all task queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      notifications.show({
        title: 'Error',
        message: taskData?.id ? 'Failed to update task' : 'Failed to create task',
        color: 'red',
      });
    }
  };

  return (
    <Modal 
      opened={open} 
      onClose={onClose} 
      padding={0} 
      withCloseButton={false} 
      size="80%"
      fullScreen={isMobile}
    >
      <TaskForm task={taskData} onSubmit={handleSubmit} onCancel={onClose} />
    </Modal>
  );
}
