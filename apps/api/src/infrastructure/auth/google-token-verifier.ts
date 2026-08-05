import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleIdentityPort } from '../../application/auth/sign-in-with-google.use-case';

@Injectable()
export class GoogleTokenVerifier implements GoogleIdentityPort {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verify(
    idToken: string,
  ): Promise<{ subject: string; email: string; name?: string }> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Invalid Google identity.');
    }

    return {
      subject: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
