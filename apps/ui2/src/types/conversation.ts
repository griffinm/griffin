export enum ConversationItemRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  TOOL = 'TOOL',
}

export interface ConversationItem {
  id: string;
  conversationId: string;
  role: ConversationItemRole;
  content: string;
  toolCalls?: any;
  toolCallId?: string | null;
  toolName?: string | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithItems extends Conversation {
  conversationItems: ConversationItem[];
}

export interface SendMessageResponse {
  userMessage: ConversationItem;
  aiMessage: ConversationItem;
}

export interface ConversationListResponse {
  data: ConversationWithItems[];
  page: number;
  resultsPerPage: number;
  totalRecords: number;
  totalPages: number;
}

