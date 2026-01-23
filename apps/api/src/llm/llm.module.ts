import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { LlmProcessor } from './llm.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { NoteModule } from '../notes/notes.module';
import { SearchModule } from '../search/search.module';
import { LLM_QUEUE } from '../queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    forwardRef(() => AuthModule),
    ConfigModule,
    NoteModule,
    SearchModule,
    BullModule.registerQueue({
      name: LLM_QUEUE,
    }),
  ],
  controllers: [LlmController],
  providers: [LlmService, LlmProcessor],
  exports: [LlmService],
})
export class LlmModule {}

