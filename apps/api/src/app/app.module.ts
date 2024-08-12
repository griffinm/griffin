import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { NotebookModule } from '../notebooks/notebook.module';
import { AuthModule } from '../auth/auth.module';
import { NoteModule } from '../notes/notes.module';
import { MediaModule } from '../media/media.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
