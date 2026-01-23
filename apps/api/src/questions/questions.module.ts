import { Module, forwardRef } from "@nestjs/common";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SearchModule } from "../search/search.module";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService],
  imports: [PrismaModule, forwardRef(() => AuthModule), forwardRef(() => UsersModule), forwardRef(() => SearchModule)],
  exports: [QuestionsService],
})
export class QuestionsModule {}
