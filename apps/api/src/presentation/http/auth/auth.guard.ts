import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtSessionAdapter } from '../../../infrastructure/auth/jwt-session.adapter';
import type { AuthenticatedRequest } from './authenticated-request';

export const SESSION_COOKIE_NAME = 'mcc_session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: JwtSessionAdapter) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    const session = await this.sessions.verify(accessToken);

    if (!session) {
      throw new UnauthorizedException();
    }

    request.currentUser = {
      id: session.userId,
      role: session.role,
    };

    return true;
  }
}

function readCookie(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const prefix = `${cookieName}=`;
  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!cookie) {
    return undefined;
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return undefined;
  }
}
