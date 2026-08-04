import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../infrastructure/database/database.constants';
import type { AppDatabase } from '../../infrastructure/database/database.types';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.database.execute(sql`select 1`);
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
  }
}
