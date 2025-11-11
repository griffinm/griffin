import { Modal, Text, Button, Stack, Group, Loader, Alert, Box, Divider } from '@mantine/core';
import { IconSparkles, IconAlertCircle, IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import { HtmlPreview } from '@/components/HtmlPreview';
import { EnhanceTaskResponse } from '@/api/tasksApi';

interface TaskEnhancementModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (enhancedDescription: string) => void;
  isLoading: boolean;
  error: string | null;
  enhancementData: EnhanceTaskResponse | null;
  originalDescription?: string;
}

export function TaskEnhancementModal({
  opened,
  onClose,
  onApply,
  isLoading,
  error,
  enhancementData,
  originalDescription,
}: TaskEnhancementModalProps) {
  const handleApply = () => {
    if (enhancementData) {
      onApply(enhancementData.enhancedDescription);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSparkles size={20} />
          <Text fw={600}>AI Enhancement</Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        {isLoading && (
          <Group justify="center" py="xl">
            <Loader size="lg" />
            <Text c="dimmed">Enhancing task with AI...</Text>
          </Group>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {!isLoading && !error && enhancementData && (
          <>
            {/* Original Description */}
            {originalDescription && (
              <Box>
                <Text size="sm" fw={600} mb="xs" c="dimmed">
                  Original Description
                </Text>
                <Box
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <HtmlPreview html={originalDescription} />
                </Box>
              </Box>
            )}

            <Divider />

            {/* Enhanced Description */}
            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600} c="green">
                  Enhanced Description
                </Text>
                <Text size="xs" c="dimmed">
                  Powered by AI
                </Text>
              </Group>
              <Box
                style={{
                  border: '1px solid #51cf66',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#f4fcf5',
                }}
              >
                <HtmlPreview html={enhancementData.enhancedDescription} />
              </Box>
            </Box>

            {/* Resources */}
            {enhancementData.resources && enhancementData.resources.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text size="sm" fw={600} mb="xs">
                    Relevant Resources ({enhancementData.resources.length})
                  </Text>
                  <Stack gap="xs">
                    {enhancementData.resources.map((resource, index) => (
                      <Box
                        key={index}
                        style={{
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          padding: '10px',
                          backgroundColor: '#fff',
                        }}
                      >
                        <Group gap="xs" wrap="nowrap">
                          <IconExternalLink size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              size="sm"
                              fw={500}
                              component="a"
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#1971c2',
                                textDecoration: 'none',
                                wordBreak: 'break-word',
                              }}
                            >
                              {resource.title}
                            </Text>
                            {resource.snippet && (
                              <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                                {resource.snippet}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            {/* Action Buttons */}
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                leftSection={<IconX size={16} />}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                leftSection={<IconCheck size={16} />}
                onClick={handleApply}
                color="green"
              >
                Apply Enhancement
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}

