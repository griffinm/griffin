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
        border: '1px solid #ced4da',
        borderRadius: '4px',
        backgroundColor: disabled ? '#f1f3f5' : 'white',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#868e96';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#ced4da';
      }}
    >
      {tags.length === 0 ? (
        <Group gap="xs" style={{ color: '#868e96', fontSize: '14px' }}>
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

