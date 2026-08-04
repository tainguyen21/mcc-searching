import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { schema } from './schema';

export type AppDatabase = NodePgDatabase<typeof schema>;
