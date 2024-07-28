import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface Props<T> {
  title: string;
  message: string;
  onConfirm: (data: T) => void;
  open: boolean;
  onClose: () => void;
  data: T | null;
}

export function ConfirmDialog<T>({
  title,
  message,
  onConfirm,
  open,
  onClose,
  data,
}: Props<T>) {
  if (!data) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm(data);
            onClose();
          }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
