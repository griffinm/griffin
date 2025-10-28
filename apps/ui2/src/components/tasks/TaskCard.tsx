import { Task, TaskPriority } from '@/types/task';
import { formatDistanceToNowStrict } from 'date-fns';
import classNames from 'classnames';
import { useState } from 'react';
import { TaskModal } from './TaskModal';
import { Group, Pill } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);

  const priorityClasses = classNames('w-1 rounded-l-md', {
    'bg-red-500': task.priority === TaskPriority.HIGH,
    'bg-yellow-500': task.priority === TaskPriority.MEDIUM,
    'bg-green-500': task.priority === TaskPriority.LOW,
  });

  const isNotCompleted = task.status !== 'COMPLETED';

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
        className="flex flex-row bg-white rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-gray-300 h-32 overflow-hidden"
        onClick={onClick}
      >
        <div className="flex flex-row h-full gap-2 w-full flex-1 min-w-0">
          <div className={priorityClasses} />

          <div className="flex flex-col h-full justify-between flex-1 p-2 min-w-0 overflow-hidden">
            <div>
              <p className="text-md font-medium mb-1 break-words">{task.title}</p>
              
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

