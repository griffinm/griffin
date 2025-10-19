import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { NotebookModule } from "../notebooks/notebook.module";

@Module({
  imports: [PrismaModule, forwardRef(() => NotebookModule)],
  providers: [
    AuthService,
    AuthGuard,
  ],
  controllers: [
    AuthController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
