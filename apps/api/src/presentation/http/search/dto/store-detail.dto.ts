export class StoreDetailDto {
  merchantName!: string;
  storeSlug!: string;
  locations!: Array<{
    locationId: string;
    displayName: string | null;
    address: string;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
    observations: Array<{
      mccCode: string;
      mccName: string;
      channel: 'offline' | 'online';
      issuerBank: string | null;
      cardNetwork: string | null;
      confidence: number;
      observedAt: string | null;
      sourceName: string;
    }>;
  }>;
}
