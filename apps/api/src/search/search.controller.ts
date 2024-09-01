import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { SearchService } from "./search.service";
import { AuthGuard } from "../auth/auth.guard";
import { RequestWithUser } from "@griffin/types";

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('query') query: string,
    @Req() req: RequestWithUser
  ) {
    return this.searchService.search(query, req.user.id);
  }
}
