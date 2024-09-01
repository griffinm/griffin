import { Module } from "@nestjs/common";
import { NotebooksController } from "./notebooks.controller";
import { NotebookService } from "./notebook.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";
import { NoteService } from "../notes/notes.service";
import { SearchModule } from "../search/search.module";

@Module({
  controllers: [NotebooksController],
  imports: [
    PrismaModule,
    SearchModule,
  ],
  providers: [
    NotebookService,
    AuthService,
    UserService,
    NoteService,
  ],
})
export class NotebookModule {}
