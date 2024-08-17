import { useState } from 'react'
import { Button, Checkbox, TextField } from '@mui/material'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import classNames from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';
import dayjs from 'dayjs';

export function Component(props: any) {
  const [isSelected, setIsSelected] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const containerClasses = classNames('py-1 my-1 cursor-pointer rounded-lg transition-all hover:bg-dark-1', {
    'bg-dark-1 rounded-lg py-5': isSelected,
  });

  const renderEdit = () => {
    return (
      <div
        className="flex flex-col gap-5 p-2"
      >
        <TextField
          placeholder="Task title"
          size="small"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          autoFocus
        />
        <TextField
          placeholder="Task description"
          size="small"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          multiline
          rows={4}
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
              variant="contained"
              onClick={() => setIsSelected(false)}
              sx={{ color: 'white'}}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
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

      <NodeViewContent className="content" />
    </NodeViewWrapper>
  )
}