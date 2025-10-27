import { Module, forwardRef } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SearchModule } from "../search/search.module";

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
  ],
  exports: [TasksService],
  imports: [
    PrismaModule,
    SearchModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule)
  ],
})
export class TasksModule {}
