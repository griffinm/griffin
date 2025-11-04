import {
  Controller,
  UseGuards,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { LlmService } from './llm.service';
import { RequestWithUser } from '@griffin/types';
import { NewConversationDto } from './dto/new-conversation.dto';
import { ConversationMessageDto } from './dto/conversation-message.dto';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationWithItemsDto } from './dto/conversation-with-items.dto';
import { ConversationItemEntity } from './entities/conversation-item.entity';

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class LlmController {
  constructor(private llmService: LlmService) {}

  /**
   * Create a new conversation
   */
  @Post('conversations')
  async createConversation(
    @Req() request: RequestWithUser,
    @Body() dto: NewConversationDto,
  ): Promise<ConversationEntity> {
    const conversation = await this.llmService.createConversation(
      request.user.id,
      dto.title,
      dto.initialMessage,
    );
    return new ConversationEntity(conversation);
  }

  /**
   * Get a conversation by ID with all messages
   */
  @Get('conversations/:id')
  async getConversation(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ConversationWithItemsDto> {
    const conversation = await this.llmService.getConversation(id, request.user.id);
    return new ConversationWithItemsDto({
      ...conversation,
      conversationItems: conversation.conversationItems.map(
        (item) => new ConversationItemEntity(item)
      ),
    });
  }

  /**
   * List all conversations for the current user
   */
  @Get('conversations')
  async listConversations(
    @Req() request: RequestWithUser,
    @Query('page') page?: string,
    @Query('resultsPerPage') resultsPerPage?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const perPage = resultsPerPage ? parseInt(resultsPerPage, 10) : 20;

    const result = await this.llmService.listConversations(
      request.user.id,
      pageNum,
      perPage,
    );

    return {
      ...result,
      data: result.data.map((conv) => ({
        ...new ConversationEntity(conv),
        conversationItems: conv.conversationItems.map(
          (item) => new ConversationItemEntity(item)
        ),
      })),
    };
  }

  /**
   * Send a message to a conversation
   */
  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ConversationMessageDto,
  ): Promise<{
    userMessage: ConversationItemEntity;
    aiMessage: ConversationItemEntity;
  }> {
    const result = await this.llmService.sendMessage(
      id,
      request.user.id,
      dto.content,
    );

    return {
      userMessage: new ConversationItemEntity(result.userMessage),
      aiMessage: new ConversationItemEntity(result.aiMessage),
    };
  }

  /**
   * Delete a conversation
   */
  @Delete('conversations/:id')
  async deleteConversation(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ConversationEntity> {
    const conversation = await this.llmService.deleteConversation(
      id,
      request.user.id,
    );
    return new ConversationEntity(conversation);
  }
}

