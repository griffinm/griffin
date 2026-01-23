import { Conversation, ConversationStatus } from '@prisma/client';

export class ConversationEntity implements Conversation {
  id: string;
  userId: string;
  title: string | null;
  status: ConversationStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<ConversationEntity>) {
    Object.assign(this, partial);
  }
}

