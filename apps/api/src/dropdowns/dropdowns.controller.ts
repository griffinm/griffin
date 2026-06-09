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
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '@griffin/types';
import { DropdownsService } from './dropdowns.service';
import { DropdownEntity } from './dto/dropdown.entity';
import { DropdownInstanceEntity } from './dto/dropdown-instance.entity';
import { NewDropdownDto } from './dto/new-dropdown.dto';
import { UpdateDropdownDto } from './dto/update-dropdown.dto';
import { NewDropdownOptionDto } from './dto/new-dropdown-option.dto';
import { UpdateDropdownOptionDto } from './dto/update-dropdown-option.dto';
import { NewDropdownInstanceDto } from './dto/new-dropdown-instance.dto';
import { UpdateDropdownInstanceDto } from './dto/update-dropdown-instance.dto';

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DropdownsController {
  constructor(private dropdownsService: DropdownsService) {}

  // ---- Definitions ----------------------------------------------------------

  @Get('dropdowns')
  async getAll(@Req() request: RequestWithUser): Promise<DropdownEntity[]> {
    const dropdowns = await this.dropdownsService.getAllForUser(request.user.id);
    return dropdowns.map((dropdown) => new DropdownEntity(dropdown));
  }

  @Get('dropdowns/:id')
  async getById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.getById(id, request.user.id);
    return new DropdownEntity(dropdown);
  }

  @Post('dropdowns')
  async create(
    @Req() request: RequestWithUser,
    @Body() body: NewDropdownDto,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.create(request.user.id, body);
    return new DropdownEntity(dropdown);
  }

  @Patch('dropdowns/:id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateDropdownDto,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.update(id, request.user.id, body);
    return new DropdownEntity(dropdown);
  }

  @Delete('dropdowns/:id')
  async deleteById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    const dropdown = await this.dropdownsService.deleteById(id, request.user.id);
    return { id: dropdown.id };
  }

  // ---- Options --------------------------------------------------------------

  @Post('dropdowns/:id/options')
  async addOption(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: NewDropdownOptionDto,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.addOption(id, request.user.id, body);
    return new DropdownEntity(dropdown);
  }

  @Patch('dropdowns/:id/options/:optionId')
  async updateOption(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() body: UpdateDropdownOptionDto,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.updateOption(
      id,
      optionId,
      request.user.id,
      body,
    );
    return new DropdownEntity(dropdown);
  }

  @Delete('dropdowns/:id/options/:optionId')
  async deleteOption(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
  ): Promise<DropdownEntity> {
    const dropdown = await this.dropdownsService.deleteOption(
      id,
      optionId,
      request.user.id,
    );
    return new DropdownEntity(dropdown);
  }

  // ---- Instances ------------------------------------------------------------

  @Post('dropdown-instances')
  async createInstance(
    @Req() request: RequestWithUser,
    @Body() body: NewDropdownInstanceDto,
  ): Promise<DropdownInstanceEntity> {
    const instance = await this.dropdownsService.createInstance(request.user.id, body);
    return new DropdownInstanceEntity(instance);
  }

  @Get('dropdown-instances/:id')
  async getInstance(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<DropdownInstanceEntity> {
    const instance = await this.dropdownsService.getInstance(id, request.user.id);
    return new DropdownInstanceEntity(instance);
  }

  @Patch('dropdown-instances/:id')
  async updateInstance(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateDropdownInstanceDto,
  ): Promise<DropdownInstanceEntity> {
    const instance = await this.dropdownsService.updateInstance(
      id,
      request.user.id,
      body,
    );
    return new DropdownInstanceEntity(instance);
  }
}
