import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import { databaseProviders } from './database.provider';
import { DrizzleMerchantRepository } from './drizzle-merchant.repository';
import { DrizzleObservationRepository } from './drizzle-observation.repository';

@Global()
@Module({
  providers: [
    ...databaseProviders,
    DrizzleMerchantRepository,
    DrizzleObservationRepository,
  ],
  exports: [
    DRIZZLE_DB,
    DrizzleMerchantRepository,
    DrizzleObservationRepository,
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
