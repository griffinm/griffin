export enum ConversationItemRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  TOOL = 'TOOL',
}

export enum ConversationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
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
  status?: ConversationStatus;
  errorMessage?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithItems extends Conversation {
  conversationItems: ConversationItem[];
}

export interface SendMessageResponse {
  userMessage: ConversationItem;
  status: string;
}

export interface PollMessagesResponse {
  messages: ConversationItem[];
  status: ConversationStatus;
  isComplete: boolean;
  errorMessage: string | null;
}

export interface ConversationListResponse {
  data: ConversationWithItems[];
  page: number;
  resultsPerPage: number;
  totalRecords: number;
  totalPages: number;
}

