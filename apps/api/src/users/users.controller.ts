import { 
  Controller, 
  Get, 
  Req, 
  ClassSerializerInterceptor, 
  UseInterceptors 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './dto/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("current")
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getHello(
    @Req() request: any
  ) {
    const user = await this.usersService.getById(request.user.id);

    return new UserEntity(user);
  }
}
  