import { Module } from '@nestjs/common';
import { GetStoreDetailUseCase } from '../../../application/search/get-store-detail.use-case';
import { SearchMerchantsUseCase } from '../../../application/search/search-merchants.use-case';
import { DrizzleMerchantRepository } from '../../../infrastructure/database/drizzle-merchant.repository';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    {
      provide: SearchMerchantsUseCase,
      inject: [DrizzleMerchantRepository],
      useFactory: (merchants: DrizzleMerchantRepository) =>
        new SearchMerchantsUseCase(merchants),
    },
    {
      provide: GetStoreDetailUseCase,
      inject: [DrizzleMerchantRepository],
      useFactory: (merchants: DrizzleMerchantRepository) =>
        new GetStoreDetailUseCase(merchants),
    },
  ],
})
export class SearchModule {}
