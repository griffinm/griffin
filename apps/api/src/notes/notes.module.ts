import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NoteService } from "./notes.service";
import { PrismaService } from "../prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import { UserService } from "../users/user.service";

@Module({
  controllers: [NotesController],
  providers: [
    NoteService,
    PrismaService,
    AuthGuard,
    UserService,
  ],
})
export class NoteModule {}
