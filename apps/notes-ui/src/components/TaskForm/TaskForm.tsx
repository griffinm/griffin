import { useState, useEffect } from "react"
import { Task } from "@prisma/client"
import { TextField, Button, Checkbox, FormControlLabel } from "@mui/material"
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { CreateOrUpdateTaskProps } from '../../utils/api';

interface Props {
  onSubmit: (task: CreateOrUpdateTaskProps) => void,
  onCancel: () => void,
  initialValues?: Task,
  showComplete?: boolean,
}

export function TaskForm({ 
  onSubmit, 
  onCancel,
  initialValues,
  showComplete = true,
}: Props) {
  const [title, setTitle] = useState<string | undefined>(initialValues?.title || "");
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState<string | undefined>(initialValues?.description || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate || dayjs().toDate());
  const [completedAt, setCompletedAt] = useState<Date | undefined>(initialValues?.completedAt || undefined);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title);
      setDescription(initialValues.description || "");
      setDueDate(initialValues.dueDate || undefined);
      setCompletedAt(initialValues.completedAt || undefined);
    } else {
      setTitle("");
      setDescription("");
      setDueDate(dayjs().toDate());
      setCompletedAt(undefined);
    }
  }, [initialValues]);

  const renderDueDate = () => {
    return (
      <div className="flex flex-col gap-4 grow">
        <div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              sx={{ width: '100%' }}
              label="Due Date"
              value={dayjs(dueDate)}
              onChange={(newValue) => setDueDate(newValue?.toDate() || dayjs().toDate())}
            />
          </LocalizationProvider>
        </div>
        <div className="flex justify-center items-center gap-2">
          <Button size="small" variant="outlined" onClick={() => setDueDate(dayjs().toDate())}>
            Today
          </Button>
          <Button size="small" variant="outlined" onClick={() => setDueDate(dayjs().add(1, 'day').toDate())}>
            Tomorrow
          </Button>
          <Button size="small" variant="outlined" onClick={() => setDueDate(dayjs().add(2, 'day').toDate())}>
            2 Days
          </Button>
          <Button size="small" variant="outlined" onClick={() => setDueDate(dayjs().add(5, 'day').toDate())}>
            5 Days
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSubmit({
      title,
      description,
      dueDate,
      completedAt: completedAt || null,
    });
  }
  
  const validate = () => {
    let isValid = true;

    if (!title) {
      setTitleError(true);
      isValid = false;
    }

    return isValid;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pb-5">
        <TextField
          fullWidth
          required
          error={titleError}
          id="outlined-basic"
          label="Title"
          variant="outlined"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value) {
              setTitleError(false);
            }
          }}
        />
      </div>
      <div className="pb-5 flex flex-row">
        {renderDueDate()}
      </div>
      <div className="pb-5">
        <TextField
          fullWidth
          multiline
          rows={5}
          id="outlined-basic"
          label="Description"
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {showComplete && (
        <div className="pb-5">
          <FormControlLabel
            control={
            <Checkbox
              checked={!!completedAt}
              onChange={(e) => {
                if (e.target.checked) {
                  setCompletedAt(new Date());
                } else {
                  setCompletedAt(undefined);
                }
              }}
            />
          }
          label="Completed"
          />
        </div>
      )}
      <div className="pb-5 flex flex-row justify-end gap-4">
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
        >
          Save
        </Button>
      </div>
    </form>
  )
}
