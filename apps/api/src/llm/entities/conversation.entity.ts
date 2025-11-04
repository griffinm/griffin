import { Conversation } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class ConversationEntity implements Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<ConversationEntity>) {
    Object.assign(this, partial);
  }
}

