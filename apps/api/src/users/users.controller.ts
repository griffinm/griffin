import { 
  Controller, 
  Get, 
  Req, 
  ClassSerializerInterceptor, 
  UseInterceptors 
} from '@nestjs/common';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './dto/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get("current")
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getCurrent(
    @Req() request: any
  ) {
    const user = await this.usersService.getById(request.user.id);

    return new UserEntity(user);
  }
}
  