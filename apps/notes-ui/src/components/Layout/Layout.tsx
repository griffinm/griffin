import { useState } from 'react'
import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";
import MenuIcon from '@mui/icons-material/Menu';
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../../providers/TaskProvider';
import { TaskModal } from '../TaskModal';
import { CreateOrUpdateTaskProps } from '../../utils/api';

export function Layout() {
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [searchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fs') === 'true';
  const { modalOpen, onModalClose, createTask, updateTask, taskToEdit } = useTasks();

  const handleTaskSubmit = (task: CreateOrUpdateTaskProps, isNew: boolean) => {
    console.log('isNew', isNew);
    if (isNew) {
      createTask(task);
    } else {
      if (taskToEdit?.id) {
        updateTask(task, taskToEdit.id);
      }
    }
    onModalClose();
  }

  const outletClasses = classnames(
    "grow bg-dark-2 md:block",
    {
      "hidden": menuExpanded,
      'h-[100vh]': isFullScreen,
    },
  );

  return (
    <div className="flex flex-col h-[100vh]">

      {!isFullScreen && (
        <div className="md:hidden bg-dark-1 text-white p-2">
          <MenuIcon onClick={() => setMenuExpanded(!menuExpanded)} />
        </div>
      )}

      <div className="grow">
        <div className="flex flex-row grow">
          {!isFullScreen && (
            <div className="bg-dark-1 text-white">
              <SideNav menuExpanded={menuExpanded} />
            </div>
          )}
          <div className={outletClasses}>
            <Outlet />
          </div>
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={onModalClose} onSubmit={handleTaskSubmit} />
    </div>
  )
}
