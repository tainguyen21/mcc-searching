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
