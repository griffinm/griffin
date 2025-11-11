import { Module, forwardRef } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SearchModule } from "../search/search.module";
import { TagModule } from "../tag/tag.module";
import { LlmModule } from "../llm/llm.module";

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
  ],
  exports: [TasksService],
  imports: [
    PrismaModule,
    SearchModule,
    TagModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => LlmModule)
  ],
})
export class TasksModule {}
