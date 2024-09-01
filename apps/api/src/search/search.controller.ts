import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from "@griffin/types";
import { SearchResultsDto } from "./dto/search-results.dto";

@Controller('search')
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('query') query: string,
    @Req() req: RequestWithUser
  ): Promise<SearchResultsDto> {
    return this.searchService.search(query, req.user.id);
  }
}
