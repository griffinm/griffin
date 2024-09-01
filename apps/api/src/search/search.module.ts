import { Module } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller"; 
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [SearchController],
  providers: [SearchService, AuthService, PrismaService],
  exports: [SearchService],
})
export class SearchModule {}
