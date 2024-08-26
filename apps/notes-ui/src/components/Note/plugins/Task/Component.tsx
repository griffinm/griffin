import { useEffect, useState } from 'react'
import { Button, Checkbox, TextField } from '@mui/material'
import { NodeViewContent, NodeViewWrapper, useEditor } from '@tiptap/react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import classNames from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';
import dayjs from 'dayjs';
import {
  updateTask,
  createTask,
  fetchTask,
} from '../../../../utils/api';

export function Component(props: any) {
  const [isSelected, setIsSelected] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (props.node.attrs.taskId && !fetched) {
      fetchTask(props.node.attrs.taskId).then((resp) => {
        setTitle(resp.data.title);
        setDueDate(resp.data.dueDate || new Date());
        setDescription(resp.data.description || '');
      })
      setFetched(true);
    }
  }, [fetched, props.node.attrs.taskId])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!props.node.attrs.taskId) {
      // This is a new task
      createTask({
        title,
        dueDate,
        description,
      }).then((resp) => {
        props.updateAttributes({
          taskId: resp.data.id,
        })
      })
    } else {
      // This is an existing task
      updateTask(props.node.attrs.taskId, {
        title,
        dueDate,
        description,
      })
    }

    setIsSelected(false);
  }

  const containerClasses = classNames('py-1 my-1 cursor-pointer rounded-lg transition-all hover:bg-dark-1', {
    'bg-dark-1 rounded-lg py-5': isSelected,
  });

  const renderEdit = () => {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-5 p-2"
      >
        <TextField
          placeholder="Task title"
          size="small"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          autoFocus
          tabIndex={0}
        />
        <TextField
          placeholder="Task description"
          size="small"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          multiline
          rows={4}
          tabIndex={1}
        />
        <div className="flex flex-row gap-2">
          <div className="flex gap-2 grow items-center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Due Date"
                views={['year', 'month', 'day']}
                value={dayjs(dueDate)}
                onChange={(newValue) => setDueDate(newValue?.toDate() || new Date())}
              />
            </LocalizationProvider>
            <Button
              variant="text"
              sx={{ color: 'white'}}
            >
              Today
            </Button>
            <Button
              variant="text"
              sx={{ color: 'white'}}
            >
              Tomorrow
            </Button>
          </div>

          <div className="flex items-center">
            <Button
              variant="text"
              sx={{ color: 'white'}}
              onClick={() => setIsSelected(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ color: 'white'}}
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    )
  }

  const renderShow = () => {
    return (
      <div
        onClick={() => setIsSelected(true)}
        className="flex justify-between items-center"
      >
        <Checkbox
          checked={false}
        />
        <div className="grow">
          {title || 'Task'}
        </div>
        <div className="pr-3 text-right">
          {format(new Date(), 'M/dd')}
          <div className="text-xs">
            {formatDistanceToNow(dueDate, { addSuffix: true })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <NodeViewWrapper className="gc-task">
      <div 
        className={containerClasses} 
        contentEditable={false}
      >
        {isSelected ? renderEdit() : renderShow()}
    </div>

      {/* <NodeViewContent className="content" /> */}
    </NodeViewWrapper>
  )
}