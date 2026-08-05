import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  SessionPort,
  SessionVerifierPort,
  UserRole,
} from '../../application/auth/session.port';

const SESSION_DURATION = '1h';

function isUserRole(value: unknown): value is UserRole {
  return value === 'user' || value === 'admin';
}

@Injectable()
export class JwtSessionAdapter implements SessionPort, SessionVerifierPort {
  constructor(private readonly config: ConfigService) {}

  async issue(input: {
    userId: string;
    role: UserRole;
  }): Promise<{ accessToken: string }> {
    const { SignJWT } = await import('jose');
    const accessToken = await new SignJWT({ role: input.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(input.userId)
      .setIssuedAt()
      .setExpirationTime(SESSION_DURATION)
      .sign(this.getSecret());

    return { accessToken };
  }

  async verify(
    accessToken: string,
  ): Promise<{ userId: string; role: UserRole } | undefined> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(accessToken, this.getSecret(), {
        algorithms: ['HS256'],
      });

      if (!payload.sub || !isUserRole(payload.role)) {
        return undefined;
      }

      return {
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      return undefined;
    }
  }

  private getSecret(): Uint8Array {
    return new TextEncoder().encode(
      this.config.getOrThrow<string>('SESSION_SECRET'),
    );
  }
}
