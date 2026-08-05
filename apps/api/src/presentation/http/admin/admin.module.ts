import { Module } from '@nestjs/common';
import { StartJobUseCase } from '../../../application/ingestion/start-job.use-case';
import { ManageSourceUseCase } from '../../../application/sources/manage-source.use-case';
import { DrizzleSourceRepository } from '../../../infrastructure/database/drizzle-source.repository';
import { AuthModule } from '../auth/auth.module';
import { SourcesController } from './sources.controller';

@Module({
  imports: [AuthModule],
  controllers: [SourcesController],
  providers: [
    {
      provide: ManageSourceUseCase,
      inject: [DrizzleSourceRepository],
      useFactory: (sources: DrizzleSourceRepository) =>
        new ManageSourceUseCase(sources),
    },
    {
      provide: StartJobUseCase,
      inject: [DrizzleSourceRepository],
      useFactory: (sources: DrizzleSourceRepository) =>
        new StartJobUseCase(sources),
    },
  ],
})
export class AdminModule {}
