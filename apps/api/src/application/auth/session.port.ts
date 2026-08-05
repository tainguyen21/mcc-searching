export type UserRole = 'user' | 'admin';

export interface SessionPort {
  issue(input: {
    userId: string;
    role: UserRole;
  }): Promise<{ accessToken: string }>;
}

export interface SessionVerifierPort {
  verify(accessToken: string): Promise<
    | {
        userId: string;
        role: UserRole;
      }
    | undefined
  >;
}
