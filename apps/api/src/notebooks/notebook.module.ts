import { Module } from "@nestjs/common";
import { NotebooksController } from "./notebooks.controller";
import { NotebookService } from "./notebook.service";
import { PrismaService } from "../prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import { UserService } from "../users/user.service";

@Module({
  controllers: [NotebooksController],
  providers: [
    NotebookService,
    PrismaService,
    AuthGuard,
    UserService,
  ],
})
export class NotebookModule {}
