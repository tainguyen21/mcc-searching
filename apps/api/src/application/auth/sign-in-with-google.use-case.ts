import type { SessionPort, UserRole } from './session.port';

export interface GoogleIdentityPort {
  verify(
    idToken: string,
  ): Promise<{ subject: string; email: string; name?: string }>;
}

export interface UserAuthPort {
  upsertGoogleUser(input: {
    googleSubject: string;
    email: string;
    displayName?: string;
    role: UserRole;
  }): Promise<{
    id: string;
    displayName: string | null;
    role: UserRole;
  }>;
}

export class SignInWithGoogleUseCase {
  constructor(
    private readonly googleIdentity: GoogleIdentityPort,
    private readonly users: UserAuthPort,
    private readonly sessions: SessionPort,
  ) {}

  async execute(input: {
    idToken: string;
    adminEmails: readonly string[];
  }): Promise<{
    accessToken: string;
    user: {
      id: string;
      displayName: string | null;
      role: UserRole;
    };
  }> {
    const identity = await this.googleIdentity.verify(input.idToken);
    const email = identity.email.trim().toLocaleLowerCase('en-US');
    const role: UserRole = input.adminEmails.includes(email) ? 'admin' : 'user';
    const user = await this.users.upsertGoogleUser({
      googleSubject: identity.subject,
      email,
      displayName: identity.name,
      role,
    });
    const session = await this.sessions.issue({
      userId: user.id,
      role: user.role,
    });

    return {
      accessToken: session.accessToken,
      user,
    };
  }
}
