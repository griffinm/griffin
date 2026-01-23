import { ConversationItem, ConversationItemRole } from '@/types/conversation';

/**
 * Filters out intermediate "Using tools..." messages.
 * These are ASSISTANT messages that have toolCalls attached.
 */
export const filterIntermediateMessages = (messages: ConversationItem[]): ConversationItem[] => {
  return messages.filter(
    (message) => !(message.role === ConversationItemRole.ASSISTANT && message.toolCalls)
  );
};

/**
 * Filters messages to remove duplicate component displays.
 * When multiple TOOL messages show the same note/task, keeps only the one with more data.
 */
export const deduplicateComponentMessages = (messages: ConversationItem[]): ConversationItem[] => {
  // Track best version of each component by type and ID
  const componentMap = new Map<string, { message: ConversationItem; hasDetail: boolean }>();

  // First pass: identify TOOL messages with componentData and find duplicates
  for (const message of messages) {
    if (message.role !== ConversationItemRole.TOOL || !message.componentData) {
      continue;
    }

    const { type, data } = message.componentData;
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      if (!item?.id) continue;

      const key = `${type}:${item.id}`;
      const hasDetail = !!(item.snippet || item.content || item.description);

      const existing = componentMap.get(key);
      if (!existing || (!existing.hasDetail && hasDetail)) {
        componentMap.set(key, { message, hasDetail });
      }
    }
  }

  // Get IDs of messages to keep (the best version of each component)
  const bestMessageIds = new Set(
    Array.from(componentMap.values()).map((v) => v.message.id)
  );

  // Second pass: filter out duplicate TOOL messages
  return messages.filter((message) => {
    if (message.role !== ConversationItemRole.TOOL || !message.componentData) {
      return true; // Keep non-TOOL messages
    }

    // Keep if this is the best version for at least one of its components
    return bestMessageIds.has(message.id);
  });
};

/**
 * Prepares messages for display by filtering and deduplicating.
 */
export const prepareMessagesForDisplay = (messages: ConversationItem[]): ConversationItem[] => {
  return deduplicateComponentMessages(filterIntermediateMessages(messages));
};
