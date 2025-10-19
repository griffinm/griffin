import { Module, forwardRef } from "@nestjs/common";
import { NotebooksController } from "./notebooks.controller";
import { NotebookService } from "./notebook.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NoteService } from "../notes/notes.service";
import { SearchModule } from "../search/search.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [NotebooksController],
  imports: [
    PrismaModule,
    SearchModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    NotebookService,
    NoteService,
  ],
  exports: [NotebookService],
})
export class NotebookModule {}
