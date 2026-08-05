import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { UserAuthPort } from '../../application/auth/sign-in-with-google.use-case';
import type { UserRole } from '../../application/auth/session.port';
import { DRIZZLE_DB } from './database.constants';
import type { AppDatabase } from './database.types';
import { users } from './schema';

@Injectable()
export class DrizzleUserRepository implements UserAuthPort {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

  async upsertGoogleUser(input: {
    googleSubject: string;
    email: string;
    displayName?: string;
    role: UserRole;
  }): Promise<{ id: string; displayName: string | null; role: UserRole }> {
    const [user] = await this.database
      .insert(users)
      .values(input)
      .onConflictDoUpdate({
        target: users.googleSubject,
        set: {
          email: input.email,
          displayName: input.displayName,
          role: input.role,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: users.id,
        displayName: users.displayName,
        role: users.role,
      });

    return user;
  }

  async findById(id: string): Promise<
    | {
        id: string;
        email: string;
        displayName: string | null;
        role: UserRole;
      }
    | undefined
  > {
    const [user] = await this.database
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }
}
