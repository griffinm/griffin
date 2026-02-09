import { Box, SimpleGrid } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const TAILWIND_COLORS = [
  'bg-red-300', 'bg-red-700',
  'bg-orange-300', 'bg-orange-700',
  'bg-amber-300', 'bg-amber-700',
  'bg-yellow-300', 'bg-yellow-700',
  'bg-lime-300', 'bg-lime-700',
  'bg-green-300', 'bg-green-700',
  'bg-emerald-300', 'bg-emerald-700',
  'bg-teal-300', 'bg-teal-700',
  'bg-cyan-300', 'bg-cyan-700',
  'bg-sky-300', 'bg-sky-700',
  'bg-blue-300', 'bg-blue-700',
  'bg-indigo-300', 'bg-indigo-700',
  'bg-violet-300', 'bg-violet-700',
  'bg-purple-300', 'bg-purple-700',
  'bg-fuchsia-300', 'bg-fuchsia-700',
  'bg-pink-300', 'bg-pink-700',
  'bg-rose-300', 'bg-rose-700',
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Box p="sm">
      <SimpleGrid cols={6} spacing="xs">
        {TAILWIND_COLORS.map((color) => {
          const colors = getTagColors(color);
          return (
            <Box
              key={color}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: colors.bg,
                border: value === color ? '3px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-gray-3)',
                transition: 'transform 0.1s ease',
              }}
              onClick={() => onChange(color)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

