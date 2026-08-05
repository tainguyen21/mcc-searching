import { Module } from '@nestjs/common';
import { DecideObservationUseCase } from '../../../application/review/decide-observation.use-case';
import { ListStagingUseCase } from '../../../application/review/list-staging.use-case';
import { MergeMerchantLocationUseCase } from '../../../application/review/merge-merchant-location.use-case';
import { DrizzleObservationRepository } from '../../../infrastructure/database/drizzle-observation.repository';
import { AuthModule } from '../auth/auth.module';
import { ReviewController } from './review.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReviewController],
  providers: [
    {
      provide: ListStagingUseCase,
      inject: [DrizzleObservationRepository],
      useFactory: (observations: DrizzleObservationRepository) =>
        new ListStagingUseCase(observations),
    },
    {
      provide: DecideObservationUseCase,
      inject: [DrizzleObservationRepository],
      useFactory: (observations: DrizzleObservationRepository) =>
        new DecideObservationUseCase(observations),
    },
    {
      provide: MergeMerchantLocationUseCase,
      inject: [DrizzleObservationRepository],
      useFactory: (observations: DrizzleObservationRepository) =>
        new MergeMerchantLocationUseCase(observations),
    },
  ],
})
export class ReviewModule {}
