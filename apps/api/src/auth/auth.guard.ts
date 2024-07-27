import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../users/user.service';

import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private usersService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request['user'] = await this.usersService.getById(2);

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
