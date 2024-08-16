import { Module } from "@nestjs/common";
import { NotebooksController } from "./notebooks.controller";
import { NotebookService } from "./notebook.service";
import { PrismaService } from "../prisma.service";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";
import { NoteService } from "../notes/notes.service";

@Module({
  controllers: [NotebooksController],
  providers: [
    NotebookService,
    PrismaService,
    AuthService,
    UserService,
    NoteService,
  ],
})
export class NotebookModule {}
