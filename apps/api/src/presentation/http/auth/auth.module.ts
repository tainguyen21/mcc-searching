import { Module } from '@nestjs/common';
import { SignInWithGoogleUseCase } from '../../../application/auth/sign-in-with-google.use-case';
import { GoogleTokenVerifier } from '../../../infrastructure/auth/google-token-verifier';
import { JwtSessionAdapter } from '../../../infrastructure/auth/jwt-session.adapter';
import { DrizzleUserRepository } from '../../../infrastructure/database/drizzle-user.repository';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    GoogleTokenVerifier,
    JwtSessionAdapter,
    AuthGuard,
    AdminGuard,
    {
      provide: SignInWithGoogleUseCase,
      inject: [GoogleTokenVerifier, DrizzleUserRepository, JwtSessionAdapter],
      useFactory: (
        googleIdentity: GoogleTokenVerifier,
        users: DrizzleUserRepository,
        sessions: JwtSessionAdapter,
      ) => new SignInWithGoogleUseCase(googleIdentity, users, sessions),
    },
  ],
  exports: [AuthGuard, AdminGuard, JwtSessionAdapter],
})
export class AuthModule {}
