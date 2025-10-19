import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { NotebookModule } from "../notebooks/notebook.module";

@Module({
  controllers: [UsersController],
  providers: [
    UserService,
  ],
  exports: [UserService],
  imports: [PrismaModule, forwardRef(() => NotebookModule), forwardRef(() => AuthModule)],
})
export class UsersModule {}
