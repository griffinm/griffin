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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }), 
    UsersModule,
    NotebookModule,
    NoteModule,
    AuthModule,
    MediaModule,
    TasksModule,
    QuestionsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppLoggerMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
