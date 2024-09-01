import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NoteService } from "./notes.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";
import { SearchModule } from "../search/search.module";

@Module({
  controllers: [NotesController],
  imports: [SearchModule, PrismaModule],
  providers: [
    NoteService,
    AuthService,
    UserService,
  ],
  exports: [NoteService],
})
export class NoteModule {}
