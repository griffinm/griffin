import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import { UserService } from "../users/user.service";

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService, AuthGuard, UserService],
})
export class TasksModule {}