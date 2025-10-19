import { Module, forwardRef } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NoteService } from "./notes.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { SearchModule } from "../search/search.module";

@Module({
  controllers: [NotesController],
  imports: [SearchModule, PrismaModule, forwardRef(() => AuthModule), forwardRef(() => UsersModule)],
  providers: [
    NoteService,
  ],
  exports: [NoteService],
})
export class NoteModule {}
