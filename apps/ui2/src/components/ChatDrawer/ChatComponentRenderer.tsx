import { Box } from '@mantine/core';
import { componentRegistry, ComponentType } from './ChatComponentRegistry';

interface ChatComponentRendererProps {
  componentData: {
    type: string;
    data: any | any[];
  };
}

/**
 * Renders rich UI components within chat messages based on componentData.
 * Handles both single components and arrays of components.
 * 
 * Example usage:
 * - Single task: { type: 'task', data: {...task object...} }
 * - Multiple tasks: { type: 'task', data: [{...task1...}, {...task2...}] }
 */
export const ChatComponentRenderer = ({ componentData }: ChatComponentRendererProps) => {
  if (!componentData || !componentData.type) {
    return null;
  }

  const { type, data } = componentData;

  // Check if component type is registered
  const Component = componentRegistry[type as ComponentType];
  if (!Component) {
    console.warn(`Unknown component type: ${type}. Available types:`, Object.keys(componentRegistry));
    return null;
  }

  // Handle null or undefined data
  if (!data) {
    return null;
  }

  // Handle array of components
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }

    return (
      <Box style={{ marginTop: 12 }}>
        <div style={{ 
          display: 'grid', 
          gap: '12px',
          gridTemplateColumns: '1fr',
        }}>
          {data.map((item, index) => {
            const props = { [type]: item };
            return <Component key={item.id || index} {...props} />;
          })}
        </div>
      </Box>
    );
  }

  // Handle single component
  const props = { [type]: data };
  return (
    <Box style={{ marginTop: 12 }}>
      <Component {...props} />
    </Box>
  );
};

