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
    channel: "offline" | "online";
    confidence: number;
    observedAt: string;
  }>;
}

export interface SearchInput {
  query?: string;
  mccCode?: string;
  categoryId?: string;
  latitude?: string;
  longitude?: string;
  radiusKm?: string;
  page?: string;
  pageSize?: string;
}

export interface SearchResponse {
  items: MerchantSearchResult[];
  total: number;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function searchMerchants(input: SearchInput): Promise<SearchResponse> {
  const params = new URLSearchParams(
    Object.entries(input).filter(([, value]) => value !== undefined) as Array<[string, string]>,
  );
  const response = await fetch(`${apiBaseUrl}/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Search failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<SearchResponse>;
}
