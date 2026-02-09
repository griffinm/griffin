import { Pill, Group, Box } from '@mantine/core';
import { IconTag } from '@tabler/icons-react';
import { Tag } from '@/types/tag';
import { getTagColors } from '@/utils/tagColors';

interface TagDisplayProps {
  tags: Tag[];
  placeholder: string;
  disabled: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onEnterEditMode: () => void;
  onRemoveTag: (tagId: string) => void;
}

export function TagDisplay({ 
  tags, 
  placeholder, 
  disabled, 
  containerRef,
  onEnterEditMode,
  onRemoveTag 
}: TagDisplayProps) {
  return (
    <Box
      ref={containerRef}
      onClick={() => {
        if (!disabled) {
          onEnterEditMode();
        }
      }}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: '36px',
        padding: '6px 12px',
        border: '1px solid var(--mantine-color-gray-4)',
        borderRadius: '4px',
        backgroundColor: disabled ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-body)',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--mantine-color-gray-6)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
      }}
    >
      {tags.length === 0 ? (
        <Group gap="xs" style={{ color: 'var(--mantine-color-gray-6)', fontSize: '14px' }}>
          <IconTag size={16} />
          {placeholder}
        </Group>
      ) : (
        <Group gap="xs">
          {tags.map(tag => {
            const colors = getTagColors(tag.color);
            return (
              <Pill
                key={tag.id}
                withRemoveButton
                onRemove={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  onRemoveTag(tag.id);
                }}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                {tag.name}
              </Pill>
            );
          })}
        </Group>
      )}
    </Box>
  );
}

