import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, AuthService, UserService],
  imports: [PrismaModule],
  exports: [QuestionsService],
})
export class QuestionsModule {}
