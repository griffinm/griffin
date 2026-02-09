import { Modal, TextInput, Stack, Text, ScrollArea, UnstyledButton, Group } from '@mantine/core';
import { useState, useMemo } from 'react';
import { IconSearch, IconFolder } from '@tabler/icons-react';
import { useNotebooks } from '@/hooks/useNotebooks';

interface MoveNoteModalProps {
  opened: boolean;
  onClose: () => void;
  onSelectNotebook: (_notebookId: string) => void;
  currentNotebookId: string;
}

export function MoveNoteModal({ 
  opened, 
  onClose, 
  onSelectNotebook,
  currentNotebookId 
}: MoveNoteModalProps) {
  const [search, setSearch] = useState('');
  const { data: notebooks = [], isLoading } = useNotebooks();

  // Filter notebooks based on search and exclude current notebook
  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((notebook) => {
      const matchesSearch = notebook.title.toLowerCase().includes(search.toLowerCase());
      const isNotCurrent = notebook.id !== currentNotebookId;
      return matchesSearch && isNotCurrent;
    });
  }, [notebooks, search, currentNotebookId]);

  const handleSelectNotebook = (notebookId: string) => {
    onSelectNotebook(notebookId);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Move note to notebook" size="md">
      <Stack gap="md">
        <TextInput
          placeholder="Search notebooks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftSection={<IconSearch size={16} />}
          autoFocus
        />

        <ScrollArea h={300} type="auto">
          <Stack gap="xs">
            {isLoading ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                Loading notebooks...
              </Text>
            ) : filteredNotebooks.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                {search ? 'No notebooks found' : 'No other notebooks available'}
              </Text>
            ) : (
              filteredNotebooks.map((notebook) => (
                <UnstyledButton
                  key={notebook.id}
                  onClick={() => handleSelectNotebook(notebook.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--mantine-color-gray-3)',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        borderColor: 'var(--mantine-color-blue-6)',
                      },
                    },
                  }}
                >
                  <Group gap="sm">
                    <IconFolder size={18} style={{ color: 'var(--mantine-color-gray-6)' }} />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {notebook.title}
                      </Text>
                      {notebook.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {notebook.description}
                        </Text>
                      )}
                    </div>
                  </Group>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

