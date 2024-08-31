import { 
  Box,
  Modal, 
  Typography,
} from "@mui/material";
import { TaskForm } from "../TaskForm";
import { CreateOrUpdateTaskProps } from "../../utils/api";
import { useTasks } from "../../providers/TaskProvider/TaskProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: CreateOrUpdateTaskProps, isNew: boolean) => void;
}

const modalContainerStyles = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  px: 3,
  py: 2,
};

export function TaskModal({ 
  open, 
  onClose, 
  onSubmit,
}: Props) {
  const { taskToEdit } = useTasks();
  const editMode = !!taskToEdit;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalContainerStyles}>
        <div className="text-white pb-5">
          <div className="text-center">
            <Typography variant="h5">
              {editMode ? 'Edit ' : 'Create '} Task
            </Typography>
          </div>
        </div>
        <div className="text-white">
          <TaskForm
            onSubmit={(task) => {
              onSubmit(task, !editMode);
            }}
            onCancel={onClose}
            showComplete={false}
            initialValues={taskToEdit}
          />
        </div>
      </Box>
    </Modal>
  );
}
