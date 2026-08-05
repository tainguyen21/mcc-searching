import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import { databaseProviders } from './database.provider';
import { DrizzleMerchantRepository } from './drizzle-merchant.repository';
import { DrizzleObservationRepository } from './drizzle-observation.repository';
import { DrizzleSourceRepository } from './drizzle-source.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';

@Global()
@Module({
  providers: [
    ...databaseProviders,
    DrizzleMerchantRepository,
    DrizzleObservationRepository,
    DrizzleSourceRepository,
    DrizzleUserRepository,
  ],
  exports: [
    DRIZZLE_DB,
    DrizzleMerchantRepository,
    DrizzleObservationRepository,
    DrizzleSourceRepository,
    DrizzleUserRepository,
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
