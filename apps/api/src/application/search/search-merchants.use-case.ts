import type {
  MerchantSearchPort,
  MerchantSearchResult,
} from '../ports/merchant.repository';

export class SearchMerchantsUseCase {
  constructor(private readonly merchants: MerchantSearchPort) {}

  execute(input: {
    query?: string;
    mccCode?: string;
    categoryId?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    page: number;
    pageSize: number;
  }): Promise<{ items: MerchantSearchResult[]; total: number }> {
    return this.merchants.search(input);
  }
}
