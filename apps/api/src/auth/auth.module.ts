import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { GoogleService } from "./google.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { NotebookModule } from "../notebooks/notebook.module";

@Module({
  imports: [PrismaModule, ConfigModule, forwardRef(() => NotebookModule)],
  providers: [
    AuthService,
    GoogleService,
    AuthGuard,
  ],
  controllers: [
    AuthController,
  ],
  exports: [AuthService, GoogleService],
})
export class AuthModule {}
