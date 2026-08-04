import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import { databaseProviders } from './database.provider';

@Global()
@Module({
  providers: databaseProviders,
  exports: [DRIZZLE_DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
