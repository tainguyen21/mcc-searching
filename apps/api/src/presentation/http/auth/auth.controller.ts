import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { SignInWithGoogleUseCase } from '../../../application/auth/sign-in-with-google.use-case';
import { DrizzleUserRepository } from '../../../infrastructure/database/drizzle-user.repository';
import { parseAdminAllowlist } from './admin.guard';
import { AuthGuard, SESSION_COOKIE_NAME } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { GoogleSignInDto } from './google-sign-in.dto';

const SESSION_MAX_AGE_MS = 60 * 60 * 1_000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInWithGoogle: SignInWithGoogleUseCase,
    private readonly users: DrizzleUserRepository,
    private readonly config: ConfigService,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async signInWithGoogleToken(
    @Body() input: GoogleSignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    user: { id: string; displayName: string | null; role: 'user' | 'admin' };
  }> {
    const result = await this.signInWithGoogle.execute({
      idToken: input.idToken,
      adminEmails: [
        ...parseAdminAllowlist(
          this.config.get<string>('ADMIN_EMAIL_ALLOWLIST'),
        ),
      ],
    });

    response.cookie(SESSION_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });

    return { user: result.user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @CurrentUser() currentUser: { id: string; role: 'user' | 'admin' },
  ): Promise<{
    id: string;
    displayName: string | null;
    role: 'user' | 'admin';
  }> {
    const user = await this.users.findById(currentUser.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      displayName: user.displayName,
      role: currentUser.role,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }
}
