import { ConversationItem, ConversationItemRole } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class ConversationItemEntity implements ConversationItem {
  id: string;
  conversationId: string;
  role: ConversationItemRole;
  content: string;
  toolCalls: any;
  toolCallId: string | null;
  toolName: string | null;
  createdAt: Date;

  constructor(partial: Partial<ConversationItemEntity>) {
    Object.assign(this, partial);
  }
}

