import { Modal, Button, Group } from "@mantine/core";
import { Task } from "@/types/task";
import { TaskForm, TaskFormData } from "@/views/tasks";
import { useMediaQuery } from "@mantine/hooks";
import { theme } from "@/theme";
import { createTask, updateTask, addTagToTask, removeTagFromTask } from "@/api/tasksApi";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useTask } from "@/hooks/useTasks";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconExternalLink } from "@tabler/icons-react";

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
  const navigate = useNavigate();
  
  // Fetch full task data including statusHistory when editing an existing task
  const { data: fullTask } = useTask(task?.id || '');
  
  // Use fullTask if available (editing), otherwise use the prop task (creating)
  const taskData = fullTask || task;

  const handleOpenInPage = () => {
    if (taskData?.id) {
      onClose();
      navigate(`/tasks/${taskData.id}`);
    }
  };

  // Refetch task data when modal opens to ensure we have the latest data
  useEffect(() => {
    if (open && task?.id) {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    }
  }, [open, task?.id, queryClient]);

  const handleSubmit = async (formData: TaskFormData) => {
    try {
      let taskId: string;
      
      if (taskData?.id) {
        // Update existing task
        await updateTask(taskData.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          priority: formData.priority,
          status: formData.status,
        });
        taskId = taskData.id;
        
        // Sync tags for existing task
        const originalTags = taskData.tags || [];
        const newTags = formData.tags || [];
        
        // Find removed tags
        const removedTags = originalTags.filter(
          (tag) => !newTags.some((newTag) => newTag.id === tag.id)
        );
        
        // Find added tags
        const addedTags = newTags.filter(
          (tag) => !originalTags.some((origTag) => origTag.id === tag.id)
        );
        
        // Remove tags
        for (const tag of removedTags) {
          await removeTagFromTask(taskId, tag.id);
        }
        
        // Add tags
        for (const tag of addedTags) {
          await addTagToTask(taskId, tag.name);
        }
        
        notifications.show({
          title: 'Success',
          message: 'Task updated successfully',
          color: 'green',
        });
      } else {
        // Create new task
        const newTask = await createTask({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          priority: formData.priority,
          status: formData.status,
        });
        taskId = newTask.id;
        
        // Add tags to new task
        if (formData.tags && formData.tags.length > 0) {
          for (const tag of formData.tags) {
            await addTagToTask(taskId, tag.name);
          }
        }
        
        notifications.show({
          title: 'Success',
          message: 'Task created successfully',
          color: 'green',
        });
      }
      
      // Invalidate all task queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // If we're editing a task, invalidate its specific query
      if (taskData?.id) {
        await queryClient.invalidateQueries({ queryKey: ['task', taskData.id] });
      }
      
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
      {taskData?.id && (
        <Group justify="flex-end" p="md" pb={0}>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconExternalLink size={14} />}
            onClick={handleOpenInPage}
          >
            Open in Page
          </Button>
        </Group>
      )}
      <TaskForm task={taskData} onSubmit={handleSubmit} onCancel={onClose} />
    </Modal>
  );
}
