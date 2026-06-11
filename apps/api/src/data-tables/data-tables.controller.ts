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
import { DataTablesService } from './data-tables.service';
import { DataTableEntity } from './dto/data-table.entity';
import { NewDataTableDto } from './dto/new-data-table.dto';
import { CloneDataTableDto } from './dto/clone-data-table.dto';
import { UpdateDataTableDto } from './dto/update-data-table.dto';

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DataTablesController {
  constructor(private dataTablesService: DataTablesService) {}

  @Post('data-tables')
  async create(
    @Req() request: RequestWithUser,
    @Body() body: NewDataTableDto,
  ): Promise<DataTableEntity> {
    const table = await this.dataTablesService.create(request.user.id, body);
    return new DataTableEntity(table);
  }

  @Post('data-tables/clone')
  async clone(
    @Req() request: RequestWithUser,
    @Body() body: CloneDataTableDto,
  ): Promise<DataTableEntity> {
    const table = await this.dataTablesService.clone(request.user.id, body);
    return new DataTableEntity(table);
  }

  @Get('data-tables/:id')
  async getById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<DataTableEntity> {
    const table = await this.dataTablesService.getById(id, request.user.id);
    return new DataTableEntity(table);
  }

  @Patch('data-tables/:id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateDataTableDto,
  ): Promise<DataTableEntity> {
    const table = await this.dataTablesService.update(id, request.user.id, body);
    return new DataTableEntity(table);
  }

  @Delete('data-tables/:id')
  async deleteById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    const table = await this.dataTablesService.deleteById(id, request.user.id);
    return { id: table.id };
  }
}
