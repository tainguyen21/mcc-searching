import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { GetStoreDetailUseCase } from '../../../application/search/get-store-detail.use-case';
import { SearchMerchantsUseCase } from '../../../application/search/search-merchants.use-case';
import { DrizzleMerchantRepository } from '../../../infrastructure/database/drizzle-merchant.repository';
import { SearchQueryDto } from './dto/search-query.dto';
import { StoreDetailDto } from './dto/store-detail.dto';

@Controller()
export class SearchController {
  constructor(
    private readonly searchMerchants: SearchMerchantsUseCase,
    private readonly getStoreDetail: GetStoreDetailUseCase,
    private readonly merchants: DrizzleMerchantRepository,
  ) {}

  @Get('mcc-codes')
  listMccCodes() {
    return this.merchants.listMccCodes();
  }

  @Get('categories')
  listCategories() {
    return this.merchants.listCategories();
  }

  @Get('search')
  search(@Query() input: SearchQueryDto) {
    if ((input.latitude === undefined) !== (input.longitude === undefined)) {
      throw new BadRequestException(
        'latitude and longitude must be supplied together',
      );
    }

    return this.searchMerchants.execute({
      query: input.query || undefined,
      mccCode: input.mccCode,
      categoryId: input.categoryId,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusKm: input.radiusKm,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
    });
  }

  @Get('stores/:slug')
  async store(@Param('slug') slug: string): Promise<StoreDetailDto> {
    const store = await this.getStoreDetail.execute(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }
}
