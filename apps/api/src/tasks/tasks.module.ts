import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    AuthService,
    UserService,
  ],
  exports: [TasksService],
  imports: [PrismaModule],
})
export class TasksModule {}
