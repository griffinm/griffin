import { 
  Controller, 
  Get, 
  Req, 
  ClassSerializerInterceptor, 
  UseInterceptors,
  Patch,
  Body,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './dto/user.entity';
import { UpdateDto } from './dto/update.dto';
import { RequestWithUser } from '@griffin/types';
import { CreateDto } from './dto/create.dto';
import { AuthService } from '../auth/auth.service';
import { CreateUserResponse } from '@griffin/types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UserService,
    private readonly authService: AuthService,
  ) {}

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
    const user = await this.usersService.updateUser(request.user.id, updateDto);
    return new UserEntity(user);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async createUser(
    @Body() createDto: CreateDto,
  ): Promise<CreateUserResponse> {
    let user = await this.usersService.createUser(createDto);
    
    user = new UserEntity(user);

    // Also create a JWT
    const authResult = await this.authService.signInWithPassword(user.email, createDto.password);

    return {
      ...user,
      jwt: authResult.jwt,
    };
  }
}
  