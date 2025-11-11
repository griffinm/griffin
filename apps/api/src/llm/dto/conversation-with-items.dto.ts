import { ConversationEntity } from '../entities/conversation.entity';
import { ConversationItemEntity } from '../entities/conversation-item.entity';

export class ConversationWithItemsDto extends ConversationEntity {
  conversationItems: ConversationItemEntity[];

  constructor(partial: Partial<ConversationWithItemsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

