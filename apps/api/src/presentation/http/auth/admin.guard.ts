import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleUserRepository } from '../../../infrastructure/database/drizzle-user.repository';
import type { AuthenticatedRequest } from './authenticated-request';
import { AuthGuard } from './auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly users: DrizzleUserRepository,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentUser = request.currentUser;

    if (!currentUser || currentUser.role !== 'admin') {
      throw new ForbiddenException();
    }

    const user = await this.users.findById(currentUser.id);
    const allowlist = parseAdminAllowlist(
      this.config.get<string>('ADMIN_EMAIL_ALLOWLIST'),
    );

    if (!user || !allowlist.has(user.email.toLocaleLowerCase('en-US'))) {
      throw new ForbiddenException();
    }

    return true;
  }
}

export function parseAdminAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLocaleLowerCase('en-US'))
      .filter(Boolean),
  );
}
