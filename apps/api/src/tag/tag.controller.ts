import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { TagService } from "./tag.service";
import { RequestWithUser } from "@griffin/types";
import { AuthGuard } from "../auth/auth.guard";
import { TagEntity } from "./entities/tag.entity";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('tags')
  async getAll(@Req() request: RequestWithUser): Promise<TagEntity[]> {
    return this.tagService.getAll(request.user.id);
  }

  @Get('tags/:objectType/:objectId')
  async getByObject(
    @Req() request: RequestWithUser,
    @Param('objectType') objectType: 'note' | 'task',
    @Param('objectId') objectId: string
  ): Promise<TagEntity[]> {
    return this.tagService.getByObject(request.user.id, objectType, objectId);
  }

  @Post('tags')
  async create(
    @Req() request: RequestWithUser,
    @Body() createTagDto: CreateTagDto
  ): Promise<TagEntity> {
    return this.tagService.create(request.user.id, createTagDto);
  }

  @Patch('tags/:tagId')
  async update(
    @Req() request: RequestWithUser,
    @Param('tagId') tagId: string,
    @Body() updateTagDto: UpdateTagDto
  ): Promise<TagEntity> {
    return this.tagService.update(request.user.id, tagId, updateTagDto);
  }

  @Delete('tags/:tagId')
  async delete(
    @Req() request: RequestWithUser,
    @Param('tagId') tagId: string
  ): Promise<TagEntity> {
    return this.tagService.delete(request.user.id, tagId);
  }
}