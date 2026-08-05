import type {
  MerchantRepository,
  StoreDetail,
} from '../ports/merchant.repository';

export class GetStoreDetailUseCase {
  constructor(private readonly merchants: MerchantRepository) {}

  execute(slug: string): Promise<StoreDetail | undefined> {
    return this.merchants.findStoreBySlug(slug);
  }
}
