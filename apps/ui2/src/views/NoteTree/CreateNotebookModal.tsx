import { Modal, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useState } from 'react';
import { useCreateNotebook } from '@/hooks';

interface CreateNotebookModalProps {
  opened: boolean;
  onClose: () => void;
  parentId?: string | null;
}

export function CreateNotebookModal({ opened, onClose, parentId }: CreateNotebookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createNotebook = useCreateNotebook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createNotebook.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: parentId || null,
      });
      
      // Reset form and close modal
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Create A New Notebook">
      <form onSubmit={handleSubmit}>
        <TextInput
          autoFocus
          placeholder="Notebook title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          mb="md"
        />
        <Textarea
          placeholder="Notebook description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb="md"
          rows={4}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createNotebook.isPending}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

