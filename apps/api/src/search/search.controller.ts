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
import type { RequestWithUser } from "@griffin/types";
import { SearchResultsDto } from "./dto/search-results.dto";

@Controller('search')
@UseInterceptors(ClassSerializerInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  
  @Get()
  @UseGuards(AuthGuard)
  async search(
    @Query('query') query: string,
    @Query('collection') collection: 'notes' | 'tasks' | 'all' = 'notes',
    @Req() req: RequestWithUser
  ): Promise<SearchResultsDto> {
    return this.searchService.search(query, req.user.id, collection);
  }

  @Get('rebuild')
  async rebuildIndex() {
    return this.searchService.rebuildIndex();
  }
}
