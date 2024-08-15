import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NoteService } from "./notes.service";
import { PrismaService } from "../prisma.service";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";

@Module({
  controllers: [NotesController],
  providers: [
    NoteService,
    PrismaService,
    AuthService,
    UserService,
  ],
})
export class NoteModule {}
