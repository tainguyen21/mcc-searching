import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/http/auth/auth.module';
import { HealthController } from './presentation/http/health.controller';
import { ReportsModule } from './presentation/http/reports/reports.module';
import { ReviewModule } from './presentation/http/review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(process.cwd(), '../../.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    DatabaseModule,
    AuthModule,
    ReportsModule,
    ReviewModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
