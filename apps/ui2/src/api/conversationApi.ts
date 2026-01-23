import { baseClient } from "./baseClient";
import {
  Conversation,
  ConversationWithItems,
  SendMessageResponse,
  ConversationListResponse,
  PollMessagesResponse,
} from "@/types/conversation";

export interface CreateConversationOptions {
  title?: string;
  initialMessage?: string;
}

export interface SendMessageOptions {
  content: string;
}

/**
 * Create a new conversation
 */
export const createConversation = async (
  options: CreateConversationOptions = {}
): Promise<Conversation> => {
  const response = await baseClient.post<Conversation>("/conversations", options);
  return response.data;
};

/**
 * Send a message to a conversation (returns immediately, queues for processing)
 */
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<SendMessageResponse> => {
  const response = await baseClient.post<SendMessageResponse>(
    `/conversations/${conversationId}/messages`,
    { content }
  );
  return response.data;
};

/**
 * Poll for new messages since a timestamp
 */
export const pollMessages = async (
  conversationId: string,
  since: Date
): Promise<PollMessagesResponse> => {
  const response = await baseClient.get<PollMessagesResponse>(
    `/conversations/${conversationId}/messages/poll`,
    {
      params: {
        since: since.toISOString(),
      },
    }
  );
  return response.data;
};

/**
 * Get a conversation by ID with all messages
 */
export const getConversation = async (
  conversationId: string
): Promise<ConversationWithItems> => {
  const response = await baseClient.get<ConversationWithItems>(
    `/conversations/${conversationId}`
  );
  return response.data;
};

/**
 * List all conversations for the current user
 */
export const listConversations = async (
  page: number = 1,
  resultsPerPage: number = 20
): Promise<ConversationListResponse> => {
  const response = await baseClient.get<ConversationListResponse>(
    `/conversations?page=${page}&resultsPerPage=${resultsPerPage}`
  );
  return response.data;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string
): Promise<Conversation> => {
  const response = await baseClient.delete<Conversation>(
    `/conversations/${conversationId}`
  );
  return response.data;
};

