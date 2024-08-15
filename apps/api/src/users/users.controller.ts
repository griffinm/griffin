import { 
  Controller, 
  Get, 
  Req, 
  ClassSerializerInterceptor, 
  UseInterceptors,
  Patch,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './dto/user.entity';
import { UpdateDto } from './dto/update.dto';
import { RequestWithUser } from '@griffin/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get("current")
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getCurrent(
    @Req() request: RequestWithUser
  ) {
    const user = await this.usersService.getById(request.user.id);

    return new UserEntity(user);
  }

  @Patch()
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUser(
    @Req() request: RequestWithUser,
    @Body() updateDto: UpdateDto,
  ) {
    return this.usersService.updateUser(request.user.id, updateDto);
  }
}
  