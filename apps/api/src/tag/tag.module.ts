import { Module, forwardRef } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { AuthModule } from "../auth/auth.module"
import { UsersModule } from "../users/users.module"
import { SearchModule } from "../search/search.module"
import { TagService } from "./tag.service"
import { TagController } from "./tag.controller"

@Module({
  controllers: [TagController],
  providers: [TagService],
  imports: [
    PrismaModule,
    SearchModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule)
  ],
  exports: [TagService],
}) export class TagModule {}