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

export interface CurrentUser {
  id: string;
  displayName: string | null;
  role: "user" | "admin";
}

export interface ReportInput {
  merchantName: string;
  address: string;
  mccCode: string;
  issuerBank: string;
  channel: "offline" | "online";
}

export interface ReportResponse {
  observationId: string;
  status: "staging";
  duplicate: boolean;
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
      channel: "offline" | "online";
      issuerBank: string | null;
      cardNetwork: string | null;
      confidence: number;
      observedAt: string | null;
      sourceName: string;
    }>;
  }>;
}

export interface StagingObservation {
  id: string;
  merchantId: string | null;
  merchantLocationId: string | null;
  mccCodeId: string;
  sourceId: string;
  sourceItemId: string | null;
  submittedByUserId: string | null;
  channel: "offline" | "online";
  issuerBank: string | null;
  cardNetwork: string | null;
  evidenceSnippet: string | null;
  observedAt: string | null;
  confidence: number;
  status: "staging";
  createdAt: string;
}

export interface Source {
  id: string;
  sourceKey: string;
  type: "community" | "facebook" | "bank";
  displayName: string;
  externalIdentifier: string | null;
  sourceUrl: string | null;
  schedule: string | null;
  retentionDays: number;
  enabled: boolean;
}

export interface SourceJob {
  id: string;
  sourceId: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function toApiError(response: Response): Promise<ApiError> {
  let fallback = `Request failed with HTTP ${response.status}`;

  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const message = (payload as { message: unknown }).message;
      const details = Array.isArray(message)
        ? message.filter((entry): entry is string => typeof entry === "string")
        : typeof message === "string"
          ? [message]
          : [];
      fallback = details[0] ?? fallback;
      return new ApiError(response.status, fallback, details);
    }
  } catch {
    // The API may return an empty body for an error response.
  }

  return new ApiError(response.status, fallback);
}

export async function searchMerchants(input: SearchInput): Promise<SearchResponse> {
  const params = new URLSearchParams(
    Object.entries(input).filter(([, value]) => value !== undefined) as Array<[string, string]>,
  );
  return request<SearchResponse>(`/search?${params.toString()}`, { cache: "no-store" });
}

export function getCurrentUser(headers?: HeadersInit): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", {
    cache: "no-store",
    headers,
  });
}

export async function signInWithGoogle(idToken: string): Promise<void> {
  await request("/auth/google", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export function signOut(): Promise<void> {
  return request("/auth/logout", { method: "POST" });
}

export function submitReport(input: ReportInput): Promise<ReportResponse> {
  return request<ReportResponse>("/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getStoreDetail(slug: string): Promise<StoreDetail> {
  const response = await fetch(`${apiBaseUrl}/stores/${encodeURIComponent(slug)}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json() as Promise<StoreDetail>;
}

export function listStagingObservations(): Promise<StagingObservation[]> {
  return request<StagingObservation[]>("/admin/review/staging", { cache: "no-store" });
}

export function decideObservation(
  observationId: string,
  input: {
    status: "approved" | "rejected";
    reason?: string;
    merchantId?: string;
    merchantLocationId?: string;
  },
): Promise<void> {
  return request(`/admin/review/${observationId}/decision`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function mergeLocations(input: {
  duplicateLocationId: string;
  canonicalLocationId: string;
  reason?: string;
}): Promise<void> {
  return request("/admin/review/merge-location", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listSources(): Promise<Source[]> {
  return request<Source[]>("/admin/sources", { cache: "no-store" });
}

export function updateSource(
  sourceId: string,
  input: Partial<Pick<Source, "displayName" | "externalIdentifier" | "sourceUrl" | "schedule" | "retentionDays" | "enabled">>,
): Promise<Source> {
  return request<Source>(`/admin/sources/${sourceId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function startSourceJob(sourceId: string): Promise<SourceJob> {
  return request<SourceJob>(`/admin/sources/${sourceId}/jobs`, {
    method: "POST",
  });
}
