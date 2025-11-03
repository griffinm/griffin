import { MiddlewareConsumer, Module, NestMiddleware } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { NotebookModule } from '../notebooks/notebook.module';
import { AuthModule } from '../auth/auth.module';
import { NoteModule } from '../notes/notes.module';
import { MediaModule } from '../media/media.module';
import { TasksModule } from '../tasks/tasks.module';
import { AppLoggerMiddleware } from './AppLogger.middleware';
import { QuestionsModule } from '../questions/questions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { TagModule } from '../tag/tag.module';
import { AudioModule } from '../audio/audio.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }), 
    AudioModule,
    UsersModule,
    NotebookModule,
    NoteModule,
    AuthModule,
    MediaModule,
    TasksModule,
    QuestionsModule,
    PrismaModule,
    SearchModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppLoggerMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
