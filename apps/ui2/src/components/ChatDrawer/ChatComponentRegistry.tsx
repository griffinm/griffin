import { TaskCard } from '@/components/tasks/TaskCard';

/**
 * Registry mapping component types to their React components.
 * This allows the chat to render rich UI components based on data type.
 * 
 * To add new component types:
 * 1. Add the component type to the registry
 * 2. Update ConversationItem interface to include the new type
 * 3. Backend tools should return componentData with that type
 */
export const componentRegistry = {
  task: TaskCard,
  // Future: Add more component types here
  // note: NoteCard,
  // contact: ContactCard,
  // etc.
};

export type ComponentType = keyof typeof componentRegistry;

