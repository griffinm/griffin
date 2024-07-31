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
    request['user'] = await this.usersService.getById("8f5d6ec7-cc57-40cf-a9b3-4fbfb846b8ba")

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
