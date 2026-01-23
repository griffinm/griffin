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
  componentData?: {
    type: 'task' | 'note';
    data: any | any[];
  };
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithItems extends Conversation {
  conversationItems: ConversationItem[];
}

export interface SendMessageResponse {
  userMessage: ConversationItem;
  aiMessage: ConversationItem;
  toolMessages: ConversationItem[];
  actionTaken: boolean;
}

export interface ConversationListResponse {
  data: ConversationWithItems[];
  page: number;
  resultsPerPage: number;
  totalRecords: number;
  totalPages: number;
}

