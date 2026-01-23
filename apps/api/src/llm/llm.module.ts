import { Module, forwardRef } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { NoteModule } from '../notes/notes.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    forwardRef(() => AuthModule),
    ConfigModule,
    NoteModule,
    SearchModule,
  ],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}

