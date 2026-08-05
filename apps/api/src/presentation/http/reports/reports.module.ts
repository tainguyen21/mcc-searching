import { Module } from '@nestjs/common';
import { CreateCommunityReportUseCase } from '../../../application/reports/create-community-report.use-case';
import { DrizzleObservationRepository } from '../../../infrastructure/database/drizzle-observation.repository';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: CreateCommunityReportUseCase,
      inject: [DrizzleObservationRepository],
      useFactory: (observations: DrizzleObservationRepository) =>
        new CreateCommunityReportUseCase(observations),
    },
  ],
})
export class ReportsModule {}
