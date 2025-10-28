import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { TagService } from "./tag.service";
import { RequestWithUser } from "@griffin/types";
import { AuthGuard } from "../auth/auth.guard";
import { TagEntity } from "./entities/tag.entity";
import { TagWithObjectsEntity } from "./entities/tag-with-objects.entity";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('tags')
  async getAll(
    @Req() request: RequestWithUser,
    @Query('search') search?: string
  ): Promise<TagEntity[]> {
    return this.tagService.getAll(request.user.id, search);
  }

  @Get('tags/objects')
  async getObjectsByTags(
    @Req() request: RequestWithUser,
    @Query('tagIds') tagIds: string,
    @Query('logicMode') logicMode: 'OR' | 'AND' = 'OR'
  ) {
    const tagIdArray = tagIds ? tagIds.split(',') : [];
    return this.tagService.getObjectsByTags(request.user.id, tagIdArray, logicMode);
  }

  @Get('tags/:id')
  async getById(
    @Req() request: RequestWithUser,
    @Param('id') id: string
  ): Promise<TagWithObjectsEntity> {
    return this.tagService.getById(request.user.id, id);
  }

  @Post('tags')
  async create(
    @Req() request: RequestWithUser,
    @Body() createTagDto: CreateTagDto
  ): Promise<TagEntity> {
    return this.tagService.create(request.user.id, createTagDto);
  }

  @Patch('tags/:id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto
  ): Promise<TagEntity> {
    return this.tagService.update(request.user.id, id, updateTagDto);
  }

  @Delete('tags/:id')
  async delete(
    @Req() request: RequestWithUser,
    @Param('id') id: string
  ): Promise<TagEntity> {
    return this.tagService.delete(request.user.id, id);
  }
}