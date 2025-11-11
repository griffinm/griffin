import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { formatDistanceToNowStrict } from 'date-fns';
import classNames from 'classnames';
import { useState } from 'react';
import { TaskModal } from './TaskModal';
import { Group, Pill, ActionIcon } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';
import { useNavigate } from 'react-router-dom';
import { IconExternalLink } from '@tabler/icons-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { updateTask } from '@/api/tasksApi';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const priorityClasses = classNames('w-1 rounded-l-md', {
    'bg-red-500': task.priority === TaskPriority.HIGH,
    'bg-yellow-500': task.priority === TaskPriority.MEDIUM,
    'bg-green-500': task.priority === TaskPriority.LOW,
  });

  const isNotCompleted = task.status !== 'COMPLETED';

  const handleOpenInPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tasks/${task.id}`);
  };

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

  const renderIncompleteTaskFooter = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today;

    return (
      <span
        className={classNames('text-xs px-2 py-1 rounded-full', {
          'bg-red-100 text-red-700': isOverdue,
          'bg-blue-100 text-blue-700': !isOverdue,
        })}
      >
        {isOverdue ? 'Overdue' : 'Due'}
      </span>
    );
  };

  const renderCompletedTaskFooter = () => {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
        Completed
      </span>
    );
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <div
        className="flex flex-row bg-white rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-gray-300 h-32 overflow-hidden relative"
        onClick={onClick}
      >
        <div className="flex flex-row h-full gap-2 w-full flex-1 min-w-0">
          <div className={priorityClasses} />

          <div className="flex flex-col h-full justify-between flex-1 p-2 min-w-0 overflow-hidden">
            <div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-md font-medium mb-1 break-words flex-1">{task.title}</p>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleOpenInPage}
                  className="flex-shrink-0"
                  title="Open in page"
                >
                  <IconExternalLink size={16} />
                </ActionIcon>
              </div>
              
              {/* Status and Priority Badges */}
              <Group gap="xs" className="mt-2" onClick={(e) => e.stopPropagation()}>
                <TaskStatusBadge status={task.status} onChange={handleStatusChange} />
                <TaskPriorityBadge priority={task.priority} onChange={handlePriorityChange} />
              </Group>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <Group gap="xs" className="mt-2">
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

            {/* Due Date Footer */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {task.dueDate && formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })}
              </div>

              {task.dueDate && (
                <div>
                  {isNotCompleted && renderIncompleteTaskFooter()}
                  {!isNotCompleted && renderCompletedTaskFooter()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        task={task}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

