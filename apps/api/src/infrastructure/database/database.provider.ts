import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import type { AppDatabase } from './database.types';
import { schema } from './schema';

export const databaseProviders: Provider[] = [
  {
    provide: PG_POOL,
    inject: [ConfigService],
    useFactory: (config: ConfigService): Pool =>
      new Pool({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
  },
  {
    provide: DRIZZLE_DB,
    inject: [PG_POOL],
    useFactory: (pool: Pool): AppDatabase => drizzle(pool, { schema }),
  },
];
