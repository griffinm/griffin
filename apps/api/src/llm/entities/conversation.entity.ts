import { Conversation } from '@prisma/client';

export class ConversationEntity implements Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<ConversationEntity>) {
    Object.assign(this, partial);
  }
}

