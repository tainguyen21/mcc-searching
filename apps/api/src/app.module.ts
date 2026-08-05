import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/http/auth/auth.module';
import { AdminModule } from './presentation/http/admin/admin.module';
import { HealthController } from './presentation/http/health.controller';
import { ReportsModule } from './presentation/http/reports/reports.module';
import { ReviewModule } from './presentation/http/review/review.module';
import { SearchModule } from './presentation/http/search/search.module';
import { InternalModule } from './presentation/http/internal/internal.module';

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
    AdminModule,
    AuthModule,
    InternalModule,
    ReportsModule,
    ReviewModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
