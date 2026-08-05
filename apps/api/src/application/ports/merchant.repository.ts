import type { PaymentChannel } from '../../domain/observation/observation-status';

export interface MerchantSearchResult {
  locationId: string;
  merchantName: string;
  storeSlug: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  observations: Array<{
    mccCode: string;
    channel: PaymentChannel;
    confidence: number;
    observedAt: string;
  }>;
}

export interface StoreDetail {
  merchantName: string;
  storeSlug: string;
  locations: Array<{
    locationId: string;
    displayName: string | null;
    address: string;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
    observations: Array<{
      mccCode: string;
      mccName: string;
      channel: PaymentChannel;
      issuerBank: string | null;
      cardNetwork: string | null;
      confidence: number;
      observedAt: string | null;
      sourceName: string;
    }>;
  }>;
}

export interface MerchantSearchPort {
  search(input: {
    query?: string;
    mccCode?: string;
    categoryId?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    page: number;
    pageSize: number;
  }): Promise<{ items: MerchantSearchResult[]; total: number }>;
}

export interface MerchantRepository extends MerchantSearchPort {
  listMccCodes(): Promise<
    Array<{
      code: string;
      englishName: string;
      vietnameseName: string | null;
      categoryId: string;
      categoryName: string;
    }>
  >;
  listCategories(): Promise<Array<{ id: string; name: string }>>;
  findStoreBySlug(slug: string): Promise<StoreDetail | undefined>;
  createMerchant(input: {
    canonicalName: string;
    normalizedName: string;
    storeSlug: string;
    merchantType?: string;
  }): Promise<{ id: string }>;
  createLocation(input: {
    merchantId: string;
    address: string;
    normalizedAddress: string;
    displayName?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ id: string }>;
  createAlias(input: {
    merchantId: string;
    merchantLocationId?: string;
    displayName: string;
    normalizedName: string;
  }): Promise<{ id: string }>;
}
