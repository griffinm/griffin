import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { LLM_QUEUE } from '../queue/queue.module';
import { ConversationStatus } from '@prisma/client';

export interface LlmMessageJobData {
  conversationId: string;
  userId: string;
  content: string;
  userMessageId: string;
}

@Processor(LLM_QUEUE)
export class LlmProcessor extends WorkerHost {
  private readonly logger = new Logger(LlmProcessor.name);

  constructor(
    @Inject(forwardRef(() => LlmService))
    private llmService: LlmService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<LlmMessageJobData>): Promise<void> {
    const { conversationId, userId, content } = job.data;

    this.logger.log(`Processing LLM job for conversation: ${conversationId}`);

    try {
      // Name the conversation from the first message as early as possible.
      // This runs in parallel with the (potentially slow) assistant response
      // so the title appears almost immediately after the user sends — it does
      // not wait for the full reply. No-ops if the conversation already has a
      // title. Failures are logged and never block the response.
      const titlePromise = this.llmService
        .generateAndUpdateTitle(conversationId, content)
        .catch((titleError) => {
          this.logger.warn(`Failed to generate title: ${titleError.message}`);
          return null;
        });

      // Process the message (this calls the LLM logic)
      await this.llmService.processMessageAsync(
        conversationId,
        userId,
        content,
      );

      // Ensure the title write has settled before marking the conversation idle.
      await titlePromise;

      // Update conversation status to IDLE (ready for next message)
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.IDLE,
        },
      });

      this.logger.log(`Completed LLM job for conversation: ${conversationId}`);
    } catch (error) {
      this.logger.error(`Error processing LLM job: ${error.message}`);

      // Update conversation status to ERROR
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.ERROR,
          errorMessage: error.message,
        },
      });

      throw error; // Re-throw to mark job as failed
    }
  }
}
