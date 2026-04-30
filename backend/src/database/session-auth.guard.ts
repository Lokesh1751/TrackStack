import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

type RequestWithSessionUser = Request & {
  session?: Request['session'] & { userId?: string };
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithSessionUser>();

    if (!req?.session?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return true;
  }
}
