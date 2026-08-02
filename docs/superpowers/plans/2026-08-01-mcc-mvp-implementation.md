# MCC Map Vietnam MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vietnam-wide, map-first MCC lookup MVP with community reports, admin review, bank/Facebook ingestion, and SEO store pages.

**Architecture:** A pnpm monorepo contains a Next.js web app and a NestJS Core API. NestJS uses Clean Architecture so business rules depend only on application ports; Prisma/PostgreSQL, Google OAuth, Mapbox, and HTTP are adapters. A separately deployable Python service normalizes source data and calls the NestJS Internal API, never the database.

**Tech Stack:** Next.js, TypeScript, NestJS, Prisma, PostgreSQL 16 with PostGIS/pg_trgm, Python 3.12, FastAPI, Mapbox, Google OAuth, Docker Compose.

## Global Constraints

- Cover all of Vietnam; MVP acceptance needs 5,000 geocoded locations and 500 approved MCC observations.
- Use Mapbox; desktop is map-first split view and mobile is map-first with a bottom sheet.
- Do not implement card recommendation, receipt upload, OCR, non-Facebook social sources, or multiple admin roles.
- One Google-authenticated Admin role; check emails against an environment-variable allowlist on every Admin API call.
- Use only Facebook API credentials supplied through environment/secret management. The project owner confirms source permissions; never scrape Facebook UI.
- Facebook ingestion reads post text, captions, and comments only; redact PII before LLM use and do not process images.
- Bank documents create bank MCC policies, never merchant MCC observations.
- A record becomes public only after explicit Admin approval. No confidence score may bypass staging.
- Do not write automated unit, integration, or E2E tests. Use the manual verification steps in each task plus build, typecheck, lint, migration, and smoke commands.
- Do not initialize Git or create commits because the workspace is not a Git repository.

---

## File Structure

```text
package.json                              workspace scripts
pnpm-workspace.yaml                       workspace membership
docker-compose.yml                        local PostgreSQL + PostGIS
.env.example                              non-secret environment contract
apps/api/
  prisma/schema.prisma                    relational schema
  prisma/migrations/                      SQL migrations and PostGIS indexes
  src/domain/                             pure entities, enums, value objects
  src/application/                        use cases and ports
  src/infrastructure/                     Prisma, OAuth, HTTP and job adapters
  src/presentation/                       controllers, DTOs, guards and modules
apps/web/
  app/                                    SSR/ISR routes and API-facing UI
  components/                             map, search, result and admin UI
  lib/                                    typed API client and browser adapters
services/ingestion/
  app/domain/                             normalized source models
  app/application/                        extract, redact, normalize, deliver use cases
  app/infrastructure/                     bank, Facebook, LLM and HTTP adapters
  app/main.py                             health endpoint and scheduled job entrypoint
docs/manual-verification.md               repeatable MVP smoke checklist
```

## Shared Interfaces

```ts
// apps/api/src/domain/observation/observation-status.ts
export type ObservationStatus = 'staging' | 'approved' | 'rejected' | 'hidden';
export type PaymentChannel = 'offline' | 'online';

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

// apps/api/src/application/ports/merchant.repository.ts
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

// ingestion payload accepted only by the Internal API
export interface NormalizedObservationInput {
  sourceKey: string;
  externalItemId: string;
  sourceUrl: string;
  observedAt?: string;
  merchantName: string;
  address?: string;
  province?: string;
  mccCode: string;
  channel: 'offline' | 'online';
  issuerBank?: string;
  cardNetwork?: string;
  evidenceSnippet?: string;
}

// apps/web/lib/api-client.ts
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
```

### Task 1: Bootstrap the monorepo and local runtime

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `apps/api/package.json`
- Create: `apps/web/package.json`
- Create: `services/ingestion/pyproject.toml`
- Create: `docs/manual-verification.md`

**Produces:** Repeatable local startup for PostGIS, the API, web, and ingestion services. Environment names are the sole contract for secrets.

- [ ] **Step 1: Create workspace membership and root scripts.**

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
```

```json
{
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "dev": "pnpm --parallel --stream dev",
    "build": "pnpm --recursive build",
    "lint": "pnpm --recursive lint",
    "typecheck": "pnpm --recursive typecheck"
  }
}
```

- [ ] **Step 2: Add PostgreSQL 16 with PostGIS to Compose.**

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: mcc
      POSTGRES_USER: mcc
      POSTGRES_PASSWORD: mcc_local_only
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]
volumes:
  postgres_data:
```

- [ ] **Step 3: Define the environment contract.** Include `DATABASE_URL`, `INTERNAL_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, `MAPBOX_ACCESS_TOKEN`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `FACEBOOK_ACCESS_TOKEN`, and `NEXT_PUBLIC_API_BASE_URL`; use empty values, never real credentials.

- [ ] **Step 4: Create the manual verification document.** Start it with commands to run Compose, apply Prisma migrations, start each service, and an unchecked checklist for every later task.

- [ ] **Step 5: Verify manually.** Run `docker compose up -d db`, confirm `pg_isready` succeeds inside the container, then run each package’s `build`, `typecheck`, and `lint` command after its scaffold exists.

### Task 2: Establish NestJS Clean Architecture and database infrastructure

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/domain/shared/domain-error.ts`
- Create: `apps/api/src/application/ports/transaction.port.ts`
- Create: `apps/api/src/infrastructure/database/prisma.service.ts`
- Create: `apps/api/src/infrastructure/database/prisma.module.ts`
- Create: `apps/api/src/presentation/http/health.controller.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0001_extensions/migration.sql`

**Produces:** A Core API that starts, exposes `/health`, loads configuration, and owns all PostgreSQL access.

- [ ] **Step 1: Create the NestJS bootstrap with global input rules.** Enable CORS only for `NEXT_PUBLIC_WEB_ORIGIN`, global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, and a global error filter mapping domain errors to stable HTTP responses.

- [ ] **Step 2: Define the database port and adapter.**

```ts
export interface TransactionPort {
  run<T>(operation: () => Promise<T>): Promise<T>;
}

@Injectable()
export class PrismaTransactionAdapter implements TransactionPort {
  constructor(private readonly prisma: PrismaService) {}
  run<T>(operation: () => Promise<T>): Promise<T> { return operation(); }
}
```

- [ ] **Step 3: Add the first SQL migration.**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

- [ ] **Step 4: Add `GET /health`.** Return `{ "status": "ok" }` only after a trivial Prisma `SELECT 1` succeeds; return HTTP 503 when database connectivity fails.

- [ ] **Step 5: Verify manually.** Apply the migration, call `/health`, stop PostgreSQL, and confirm the endpoint returns 503 without exposing a connection string.

### Task 3: Model merchants, locations, MCC observations, provenance, and audit history

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0002_mcc_core/migration.sql`
- Create: `apps/api/src/domain/observation/observation-status.ts`
- Create: `apps/api/src/domain/observation/confidence.ts`
- Create: `apps/api/src/application/ports/merchant.repository.ts`
- Create: `apps/api/src/application/ports/observation.repository.ts`
- Create: `apps/api/src/infrastructure/database/prisma-merchant.repository.ts`
- Create: `apps/api/src/infrastructure/database/prisma-observation.repository.ts`

**Consumes:** `PrismaService` and `TransactionPort` from Task 2.

**Produces:** The persistence and domain contract required by reports, ingestion, admin review, search, and SEO pages.

- [ ] **Step 1: Add Prisma models for `User`, `Merchant`, `MerchantLocation`, `MerchantAlias`, `MccCode`, `MccObservation`, `Source`, `SourceItem`, `IngestionJob`, `BankDocument`, `BankMccPolicy`, and `AuditLog`.** Store observation status as a PostgreSQL enum and require every observation to have a source.

- [ ] **Step 2: Add PostGIS and fuzzy-search SQL beyond Prisma’s standard types.**

```sql
ALTER TABLE "MerchantLocation" ADD COLUMN geo geography(Point, 4326);
CREATE INDEX merchant_location_geo_gist ON "MerchantLocation" USING GIST (geo);
CREATE INDEX merchant_alias_name_trgm ON "MerchantAlias" USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX merchant_name_trgm ON "Merchant" USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX observation_public_lookup ON "MccObservation" (status, mcc_code_id, merchant_location_id);
```

- [ ] **Step 3: Implement confidence as a bounded domain value object.**

```ts
export class Confidence {
  private constructor(readonly value: number) {}
  static from(value: number): Confidence {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new DomainError('INVALID_CONFIDENCE');
    return new Confidence(Math.round(value));
  }
}
```

- [ ] **Step 4: Implement repositories so public queries always include `status = 'approved'`; admin repositories may request staging and hidden records explicitly.**

- [ ] **Step 5: Verify manually.** Insert one merchant, one location with a valid WGS84 point, one approved observation, and one staging observation; inspect the index list and confirm the public repository returns only the approved record.

### Task 4: Add Google authentication and the single Admin boundary

**Files:**
- Create: `apps/api/src/application/auth/sign-in-with-google.use-case.ts`
- Create: `apps/api/src/application/auth/session.port.ts`
- Create: `apps/api/src/infrastructure/auth/google-token-verifier.ts`
- Create: `apps/api/src/infrastructure/auth/jwt-session.adapter.ts`
- Create: `apps/api/src/presentation/http/auth/auth.controller.ts`
- Create: `apps/api/src/presentation/http/auth/current-user.decorator.ts`
- Create: `apps/api/src/presentation/http/auth/auth.guard.ts`
- Create: `apps/api/src/presentation/http/auth/admin.guard.ts`

**Consumes:** `User` persistence from Task 3 and Google client configuration from Task 1.

**Produces:** An API session with a role determined only by `ADMIN_EMAIL_ALLOWLIST`.

- [ ] **Step 1: Define the use-case boundary.**

```ts
export interface GoogleIdentityPort {
  verify(idToken: string): Promise<{ subject: string; email: string; name?: string }>;
}
export interface SessionPort {
  issue(input: { userId: string; role: 'user' | 'admin' }): Promise<{ accessToken: string }>;
}
```

- [ ] **Step 2: Implement `POST /auth/google`.** Verify a Google ID token, upsert the local user, split `ADMIN_EMAIL_ALLOWLIST` on commas, assign `admin` only on exact case-insensitive email match, and return a short-lived API token through an HTTP-only secure cookie in production.

- [ ] **Step 3: Add guards.** `AuthGuard` requires a valid API session; `AdminGuard` first invokes `AuthGuard`, then checks both session role and the current allowlist so removing an email takes effect immediately.

- [ ] **Step 4: Add `GET /auth/me` for web hydration.** Return id, display name, and role; never return Google token material.

- [ ] **Step 5: Verify manually.** Sign in with an allowlisted email and a non-allowlisted email; verify both can report, only the allowlisted email can call an Admin route, and removing an allowlist entry denies the next Admin request.

### Task 5: Build community reports and the Admin review workflow

**Files:**
- Create: `apps/api/src/application/reports/create-community-report.use-case.ts`
- Create: `apps/api/src/application/review/list-staging.use-case.ts`
- Create: `apps/api/src/application/review/decide-observation.use-case.ts`
- Create: `apps/api/src/application/review/merge-merchant-location.use-case.ts`
- Create: `apps/api/src/presentation/http/reports/reports.controller.ts`
- Create: `apps/api/src/presentation/http/review/review.controller.ts`
- Create: `apps/api/src/presentation/http/review/dto/create-report.dto.ts`
- Create: `apps/api/src/presentation/http/review/dto/decide-observation.dto.ts`

**Consumes:** Auth from Task 4 and observation repositories from Task 3.

**Produces:** A community submission flow and explicit Admin decisions that create audit records.

- [ ] **Step 1: Implement the report DTO.** Require merchant name, address, 4-digit MCC code, issuer bank, and `offline` or `online` channel. Reject unknown MCC codes and invalid channels before the use case runs.

- [ ] **Step 2: Create reports as staging observations.** Link them to a `community` source, set initial confidence from complete required fields, attach the submitting user, and deduplicate same source/user/merchant/MCC/channel submissions in a seven-day window.

- [ ] **Step 3: Implement Admin decisions.** `approve` requires a resolved merchant and, for offline observations, a geocoded location; `reject` requires a non-empty reason; `hide` is only available for previously approved observations. Each decision writes `AuditLog` with actor, before/after status, reason, and timestamp.

- [ ] **Step 4: Implement merge.** Move aliases and observations from a duplicate merchant location to the canonical location in one transaction, write an audit entry, and never delete the source item.

- [ ] **Step 5: Verify manually.** Submit a report as a normal user, confirm it is absent from public search, approve it as Admin, confirm it becomes searchable, then hide it and confirm it disappears while its audit entry remains.

### Task 6: Implement public MCC and merchant search with PostGIS and fuzzy matching

**Files:**
- Create: `apps/api/src/application/search/search-merchants.use-case.ts`
- Create: `apps/api/src/application/search/get-store-detail.use-case.ts`
- Modify: `apps/api/src/infrastructure/database/prisma-merchant.repository.ts`
- Create: `apps/api/src/presentation/http/search/search.controller.ts`
- Create: `apps/api/src/presentation/http/search/dto/search-query.dto.ts`
- Create: `apps/api/src/presentation/http/search/dto/store-detail.dto.ts`

**Consumes:** `MerchantSearchPort` from Task 3.

**Produces:** `GET /mcc-codes`, `GET /categories`, `GET /search`, and `GET /stores/:slug`.

- [ ] **Step 1: Validate the search query.** Accept optional text query, MCC, category, latitude/longitude pair, radius 1–50 km, page at least 1, and page size 1–50. Reject a lone latitude or longitude.

- [ ] **Step 2: Use parameterized SQL for ranked text and geo results.**

```sql
WHERE o.status = 'approved'
  AND ($1::text IS NULL OR similarity(ma.normalized_name, $1) > 0.18)
  AND ($2::text IS NULL OR mcc.code = $2)
  AND ($3::geography IS NULL OR ST_DWithin(ml.geo, $3, $4))
ORDER BY CASE WHEN $1 IS NULL THEN 0 ELSE similarity(ma.normalized_name, $1) END DESC,
         o.confidence DESC,
         o.observed_at DESC
```

- [ ] **Step 3: Group results by location.** Return canonical name, address, coordinates, distance when available, highest-confidence matching observation, and all matching approved channels in a typed response.

- [ ] **Step 4: Implement store detail.** Resolve the canonical slug, return 404 for hidden/inactive location only, and expose source display name, observed date, channel, issuer bank/card network when known, and confidence without exposing raw social content.

- [ ] **Step 5: Verify manually.** Check exact, misspelled, MCC-only, category-only, and coordinates-plus-radius searches; inspect query plan for GiST/GIN use; load 100,000 representative rows and record response time for a 5 km query.

### Task 7: Create source registry, ingestion jobs, and the protected Internal API

**Files:**
- Create: `apps/api/src/application/sources/manage-source.use-case.ts`
- Create: `apps/api/src/application/ingestion/receive-normalized-observation.use-case.ts`
- Create: `apps/api/src/application/ingestion/start-job.use-case.ts`
- Create: `apps/api/src/application/ingestion/finish-job.use-case.ts`
- Create: `apps/api/src/presentation/http/admin/sources.controller.ts`
- Create: `apps/api/src/presentation/http/internal/internal-ingestion.controller.ts`
- Create: `apps/api/src/presentation/http/internal/internal-api-key.guard.ts`
- Create: `apps/api/src/presentation/http/internal/dto/normalized-observation.dto.ts`

**Consumes:** staging/review interfaces from Task 5.

**Produces:** Admin-configured sources and a single safe write boundary for Python ingestion.

- [ ] **Step 1: Implement source registry fields.** Require unique `sourceKey`, type (`community`, `facebook`, `bank`), display name, schedule, enabled state, retention days, and a non-secret external identifier/URL. Do not store tokens in the database.

- [ ] **Step 2: Protect Internal API.** Compare the `X-API-KEY` header against `INTERNAL_API_KEY` with timing-safe equality; return 401 for absent/incorrect keys and never describe the expected value.

- [ ] **Step 3: Validate and idempotently receive normalized observations.** Build the idempotency key from source key and external item ID, create or update `SourceItem`, and create staging observation candidates only. If the source is disabled, return a stable ignored result and create no observation.

- [ ] **Step 4: Track jobs.** Admin can start a named job, see count and timestamps, finish it as `succeeded`/`failed`, and rerun a source by creating a new job record rather than overwriting history.

- [ ] **Step 5: Verify manually.** Create a Facebook source as Admin, call Internal API with bad and good keys, submit the same payload twice, confirm one source item/candidate exists, disable the source, and confirm the next payload is ignored.

### Task 8: Scaffold Python ingestion with redaction, extraction, and delivery ports

**Files:**
- Create: `services/ingestion/app/main.py`
- Create: `services/ingestion/app/domain/models.py`
- Create: `services/ingestion/app/application/redact_pii.py`
- Create: `services/ingestion/app/application/extract_candidate.py`
- Create: `services/ingestion/app/application/deliver_candidate.py`
- Create: `services/ingestion/app/application/ports.py`
- Create: `services/ingestion/app/infrastructure/internal_api_client.py`
- Create: `services/ingestion/app/infrastructure/settings.py`

**Consumes:** `NormalizedObservationInput` from Task 7.

**Produces:** A running FastAPI worker that has no direct PostgreSQL dependency and can safely send a normalized candidate to NestJS.

- [ ] **Step 1: Define Python models and ports.**

```python
class SourceItem(BaseModel):
    external_item_id: str
    source_url: HttpUrl
    text: str
    observed_at: datetime | None = None

class LlmPort(Protocol):
    async def extract(self, text: str) -> dict: ...

class InternalApiPort(Protocol):
    async def submit(self, payload: dict) -> dict: ...
```

- [ ] **Step 2: Redact PII before extraction.** Replace email addresses, Vietnamese phone numbers, card-like number sequences, and Facebook handles with typed tokens; preserve merchant and MCC text whenever possible.

- [ ] **Step 3: Validate normalized candidates.** Require a 4-digit MCC, merchant name, channel, source key/item ID, and source URL before calling NestJS. Return a local rejected reason for incomplete candidates.

- [ ] **Step 4: Implement Internal API client.** Send JSON with `X-API-KEY`, finite timeouts, and an idempotency-preserving retry for connection errors only; do not retry 4xx validation responses.

- [ ] **Step 5: Add `GET /health` and verify manually.** Start the worker, call health, submit a hand-crafted normalized payload to a local API, and inspect that no database credentials are present in the Python environment contract.

### Task 9: Add strict-schema LLM fallback and bank-document ingestion

**Files:**
- Create: `services/ingestion/app/application/llm_fallback.py`
- Create: `services/ingestion/app/infrastructure/gemini_client.py`
- Create: `services/ingestion/app/infrastructure/groq_client.py`
- Create: `services/ingestion/app/infrastructure/openrouter_client.py`
- Create: `services/ingestion/app/infrastructure/bank_document_fetcher.py`
- Create: `services/ingestion/app/application/ingest_bank_document.py`
- Create: `apps/api/src/application/ingestion/receive-bank-policy.use-case.ts`
- Create: `apps/api/src/presentation/http/internal/dto/bank-policy.dto.ts`

**Consumes:** Python redaction/settings from Task 8 and Internal API guards from Task 7.

**Produces:** Daily, change-aware bank policy ingestion for VPBank, Techcombank, VIB, UOB, HSBC, Cake, Shinhan, and TPBank.

- [ ] **Step 1: Define the strict bank policy schema.**

```python
class ExtractedBankPolicy(BaseModel):
    bank_code: str
    document_url: HttpUrl
    document_hash: str
    effective_from: date | None = None
    effective_to: date | None = None
    eligible_mcc_codes: list[constr(pattern=r"^\d{4}$")]
    excluded_mcc_codes: list[constr(pattern=r"^\d{4}$")]
```

- [ ] **Step 2: Implement waterfall behavior.** Call Gemini first; on quota, timeout, malformed JSON, or schema rejection call Groq; then OpenRouter. If all fail, mark the job failed with provider names and a non-sensitive reason; do not send a partial policy.

- [ ] **Step 3: Fetch only configured bank URLs and hash normalized document bytes.** If the latest successful hash matches, record a no-change job and skip extraction. Treat HTTP 4xx/5xx as a failed source job.

- [ ] **Step 4: Add a separate Internal API endpoint for bank policies.** Persist `BankDocument` and `BankMccPolicy`; prohibit this endpoint from writing `MccObservation`.

- [ ] **Step 5: Verify manually.** Run a configured document once, run it again unchanged, simulate invalid LLM JSON, and inspect that a policy can be created but no public merchant search result changes.

### Task 10: Implement the Facebook API adapter and scheduled social ingestion

**Files:**
- Create: `services/ingestion/app/infrastructure/facebook_client.py`
- Create: `services/ingestion/app/application/ingest_facebook_source.py`
- Create: `services/ingestion/app/application/scheduler.py`
- Modify: `services/ingestion/app/main.py`
- Modify: `docs/manual-verification.md`

**Consumes:** source registry from Task 7 and redaction/LLM/delivery from Tasks 8–9.

**Produces:** Scheduled ingestion of configured Facebook post text, captions, and comments into staging.

- [ ] **Step 1: Limit the client boundary.** The adapter receives group ID, cursor, and API token from settings; it returns typed post/comment records. It must not navigate Facebook HTML, download images, collect profiles, or use a token in a log message.

- [ ] **Step 2: Process text separately per source item.** Concatenate post message and caption as one item; process each comment as a separate item linked by parent external ID. Redact PII before keyword filtering and LLM extraction.

- [ ] **Step 3: Use source schedule and cursors.** Read only enabled Facebook sources, persist the next cursor in non-secret source configuration, and record a job even when no matching item is found.

- [ ] **Step 4: Isolate adapter failures.** Permission failure, expired token, rate limit, or missing Graph API field marks that source job failed; it must not stop the scheduler from processing other sources.

- [ ] **Step 5: Verify manually.** With an owner-provided authorized test group, inspect one post and one comment end-to-end: raw text is redacted, image is ignored, candidate reaches staging, approval is still required, and disabling the source prevents future delivery.

### Task 11: Build the Next.js map-first public search experience

**Files:**
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/components/search/search-bar.tsx`
- Create: `apps/web/components/search/search-filters.tsx`
- Create: `apps/web/components/search/search-results.tsx`
- Create: `apps/web/components/map/merchant-map.tsx`
- Create: `apps/web/components/map/location-picker.tsx`
- Create: `apps/web/lib/api-client.ts`
- Create: `apps/web/lib/geolocation.ts`

**Consumes:** public endpoints from Task 6 and Mapbox token from Task 1.

**Produces:** Map-first desktop split view and mobile full-map/bottom-sheet search with an explicit non-GPS path.

- [ ] **Step 1: Create a typed API client.**

```ts
export async function searchMerchants(input: SearchInput): Promise<SearchResponse> {
  const params = new URLSearchParams(removeUndefined(input));
  return fetchJson<SearchResponse>(`${API_BASE_URL}/search?${params}`, { cache: 'no-store' });
}
```

- [ ] **Step 2: Build the search controls.** Support text, MCC/category, channel, radius, province/city selector, and manual address. Request browser GPS only after the user presses “Tìm quanh đây”; a denied permission retains manual location controls.

- [ ] **Step 3: Render desktop map-first layout.** Keep Mapbox map visible beside a scrollable result list. Selecting a pin highlights the result; selecting a result flies to and opens its pin.

- [ ] **Step 4: Render mobile map-first layout.** Map occupies the viewport, results appear in a draggable bottom sheet, and map interaction remains available above the sheet.

- [ ] **Step 5: Verify manually.** Search without GPS using a province, reject the browser GPS prompt, search by typo and MCC, select pins/results in both directions, and verify empty results offer the report CTA.

### Task 12: Add Google sign-in, reporting, store SEO pages, and Admin web UI

**Files:**
- Create: `apps/web/app/stores/[slug]/page.tsx`
- Create: `apps/web/app/report/page.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/app/admin/staging/page.tsx`
- Create: `apps/web/app/admin/sources/page.tsx`
- Create: `apps/web/components/auth/google-sign-in.tsx`
- Create: `apps/web/components/reports/report-form.tsx`
- Create: `apps/web/components/store/observation-table.tsx`
- Create: `apps/web/components/admin/staging-queue.tsx`
- Create: `apps/web/components/admin/source-jobs.tsx`
- Create: `apps/web/app/api/revalidate/route.ts`

**Consumes:** auth, report, review, source, and store APIs from Tasks 4–7.

**Produces:** SEO-ready store pages, authenticated reporting, and the single Admin workflow.

- [ ] **Step 1: Implement Google sign-in handoff.** Obtain Google credential in the browser, send it only to `POST /auth/google`, then hydrate UI from `/auth/me`; do not persist Google credentials in local storage.

- [ ] **Step 2: Build report form.** Require merchant/location, MCC, issuer bank, and channel; render server validation errors inline; after success show that the report is awaiting review.

- [ ] **Step 3: Build `stores/[slug]` with SSR/ISR.** Fetch store detail server-side, render canonical title/description, address, map coordinate, and observation table; return `notFound()` for API 404. Set a bounded revalidation interval and accept an authenticated on-demand revalidation request from API only.

- [ ] **Step 4: Build Admin pages.** Guard routes using `/auth/me`, present staging candidate/source/permalink and approve/reject/merge actions, and display source enabled state plus latest jobs. A non-admin must see a 403/redirect and no staging content.

- [ ] **Step 5: Verify manually.** Inspect page HTML without JavaScript for store name/MCC/address, submit report after Google sign-in, approve it from Admin, reload the store route, and ensure a normal user cannot load Admin content.

### Task 13: Add operations, performance readiness, and release acceptance

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `docs/manual-verification.md`
- Create: `docs/operations.md`
- Create: `apps/api/scripts/seed-mcc.ts`
- Create: `apps/api/scripts/seed-locations.ts`

**Consumes:** all previous tasks.

**Produces:** A documented local/production runbook, non-secret data seeding, health visibility, backups, and a release checklist.

- [ ] **Step 1: Add production-shaped Compose profiles.** Provide separate `web`, `api`, and `ingestion` services, pass environment variables by name, configure health checks, and keep PostgreSQL data in a named volume.

- [ ] **Step 2: Implement seed scripts.** Seed MCC catalog and import only operator-provided location data from a local CSV with columns `merchant_name,address,province,latitude,longitude`. Reject invalid coordinates and report imported/rejected totals.

- [ ] **Step 3: Write operations runbook.** Include database backup/restore commands, rotating `INTERNAL_API_KEY` and OAuth/LLM/Facebook secrets, source disable procedure, worker recovery, and ISR revalidation failure recovery.

- [ ] **Step 4: Complete the manual acceptance checklist.** Include data counts, 5,000/500 readiness checks, source/job health, Admin access, public search, SEO rendering, disabled-source behavior, and 100,000-row PostGIS benchmark under 300 ms.

- [ ] **Step 5: Verify manually.** Start all services from a clean local database, import a sample CSV, run one bank and one authorized Facebook source, approve observations, exercise the public flow, perform a backup and restore in a non-production database, and record benchmark result in the checklist.

## Plan Self-Review

### Spec coverage

- Map-first desktop/mobile, manual location, Mapbox, SEO store pages, fuzzy search, PostGIS and latency: Tasks 3, 6, 11, 12, 13.
- Google OAuth, one Admin role, environment allowlist, community reports and Admin staging approval: Tasks 4 and 5.
- Clean Architecture, service separation, DTO-only Internal API and no Python database access: Tasks 2, 7, and 8.
- Facebook posts/comments only, no image processing, source control and privacy redaction: Tasks 7, 8, and 10.
- Eight-bank document policy ingestion and free-tier LLM waterfall: Task 9.
- Idempotency, audit history, source disable/hidden data, health, backup, and manual acceptance: Tasks 5, 7, 10, and 13.
- Explicitly excluded card recommendation, OCR, non-Facebook social sources, multi-admin roles, and automated tests: Global Constraints.

### Consistency checks

- All ingestion writes use `NormalizedObservationInput` or the separate bank-policy endpoint, both guarded by `X-API-KEY`.
- Only Tasks 5 and 7 create observations; both create staging records, so no ingestion path bypasses Admin approval.
- Search uses only `approved` observations as established in Task 3 and implemented in Task 6.
- All frontend consumers use API endpoints introduced by prior tasks.
