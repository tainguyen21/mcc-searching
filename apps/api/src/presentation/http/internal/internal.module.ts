import { Module } from '@nestjs/common';
import { ReceiveNormalizedObservationUseCase } from '../../../application/ingestion/receive-normalized-observation.use-case';
import { ReceiveBankPolicyUseCase } from '../../../application/ingestion/receive-bank-policy.use-case';
import { DrizzleSourceRepository } from '../../../infrastructure/database/drizzle-source.repository';
import { InternalIngestionController } from './internal-ingestion.controller';
import { InternalApiKeyGuard } from './internal-api-key.guard';

@Module({
  controllers: [InternalIngestionController],
  providers: [
    InternalApiKeyGuard,
    {
      provide: ReceiveNormalizedObservationUseCase,
      inject: [DrizzleSourceRepository],
      useFactory: (sources: DrizzleSourceRepository) =>
        new ReceiveNormalizedObservationUseCase(sources),
    },
    {
      provide: ReceiveBankPolicyUseCase,
      inject: [DrizzleSourceRepository],
      useFactory: (sources: DrizzleSourceRepository) =>
        new ReceiveBankPolicyUseCase(sources),
    },
  ],
})
export class InternalModule {}
