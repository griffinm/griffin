import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { TruncatedDescription } from './TruncatedDescriptoin';
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

interface DraggableTaskProps {
  task: Task;
  isLastTask: boolean;
  lastTaskElementRef: (_node: HTMLDivElement | null) => void;
}

export function DraggableTask({ task, isLastTask, lastTaskElementRef }: DraggableTaskProps) {
  const [showModal, setShowModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: task,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setShowModal(true);
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (isLastTask) {
          lastTaskElementRef(node);
        }
      }}
      data-task-id={task.id}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-[var(--mantine-color-gray-4)] rounded-lg bg-[var(--mantine-color-body)] shadow-sm hover:shadow-md transition-shadow min-w-0 cursor-grab active:cursor-grabbing w-full"
    >
      <TaskContent task={task} onClick={handleClick} />
      {showModal && <TaskModal task={task} open={showModal} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function TaskContent({ task, onClick }: { task: Task, onClick: React.MouseEventHandler<HTMLDivElement> }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNotCompleted = !task?.completedAt;
  const priorityClasses = classNames('h-full w-[10px] rounded-l-md', {
    'bg-red-400': task.priority === TaskPriority.HIGH,
    'bg-yellow-400': task.priority === TaskPriority.MEDIUM,
    'bg-green-400': task.priority === TaskPriority.LOW,
  });

  const handleOpenInPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  function renderCompletedTaskFooter() {
    if (!task.completedAt) {
      return null;
    }

    return (
      <div className="flex justify-end mt-2">
        <p className="text-xs text-[var(--mantine-color-dimmed)]">
          Completed: {formatDistanceToNowStrict(new Date(task.completedAt), { addSuffix: true })}
        </p>
      </div>
    );
  }

  function renderIncompleteTaskFooter() {
    if (!task.dueDate) {
      return null;
    }
    
    return (
      <div className="flex justify-end">
        <p className="text-xs text-[var(--mantine-color-dimmed)]">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
      <div className="flex flex-row h-full gap-2 w-full flex-1 min-w-0" onClick={e => onClick(e)}>
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
            <Group gap="xs" className="mt-2" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
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
            <div className="text-xs text-[var(--mantine-color-dimmed)]">
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
  );
}
