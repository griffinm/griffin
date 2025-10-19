import { Module, forwardRef } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller"; 
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SearchController],
  providers: [SearchService, PrismaService],
  exports: [SearchService],
})
export class SearchModule {}
