import { Modal, Text, Button, Group } from '@mantine/core';

interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Text size="sm" mb="md">
        {message}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button color={confirmColor} onClick={handleConfirm} loading={isLoading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}

