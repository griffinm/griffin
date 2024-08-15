import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../prisma.service";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../users/user.service";

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    PrismaService,
    AuthService,
    UserService,
  ],
})
export class TasksModule {}