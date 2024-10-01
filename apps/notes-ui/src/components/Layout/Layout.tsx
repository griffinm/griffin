import { useState, useEffect } from 'react'
import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";
import MenuIcon from '@mui/icons-material/Menu';
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../../providers/TaskProvider';
import { useNotes } from '../../providers/NoteProvider';
import { TaskModal } from '../TaskModal';
import { CreateOrUpdateTaskProps } from '../../utils/api';

export function Layout() {
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [searchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fs') === 'true';
  const { modalOpen, onModalClose, createTask, updateTask, taskToEdit } = useTasks();
  const { currentNote, setCurrentNoteId, currentNotebook } = useNotes();

  useEffect(() => {
    if (currentNote) {
      setMenuExpanded(false);
    }
  }, [currentNote]);

  const handleTaskSubmit = (task: CreateOrUpdateTaskProps, isNew: boolean) => {
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
    "grow bg-dark-2 md:block overflow-y-scroll no-scrollbar",
    {
      "hidden": menuExpanded,
      'h-[100vh]': isFullScreen,
      'w-[400px]': !!currentNotebook,
    },
  );

  const navClasses = classnames(
    "bg-dark-1 text-white md:flex md:w-[250px] sticky h-[100vh] top-0 overflow-y-scroll overflow-x-wrap no-scrollbar",
    {
      "hidden": !menuExpanded,
    },
  );

  return (
    <div className="flex flex-col h-full">

      {!isFullScreen && (
        <div className="md:hidden bg-dark-1 text-white">
          <MenuIcon onClick={() => {
            setCurrentNoteId();
            setMenuExpanded(!menuExpanded);
          }} />
        </div>
      )}

      <div className="flex grow">
        <div className="flex flex-row grow">
          {!isFullScreen && (
            <div className={navClasses}>
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
