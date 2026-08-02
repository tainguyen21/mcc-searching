# MCC Map Vietnam MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vietnam-wide, map-first MCC lookup MVP with community reports, admin review, bank ingestion, capability-gated Facebook ingestion, and SEO store pages.

**Architecture:** A pnpm monorepo contains a Next.js web app and a NestJS Core API. NestJS uses Clean Architecture so business rules depend only on application ports; Drizzle/node-postgres, Google Identity Services, Mapbox, and HTTP are adapters. A separately deployable Python service normalizes source data and calls the NestJS Internal API, never the database. Resource guides and Mermaid diagrams are maintained beside the implementation and are acceptance deliverables.

**Tech Stack:** Node.js 24 LTS, pnpm 11, Next.js, TypeScript, NestJS, Drizzle ORM, Drizzle Kit, node-postgres, PostgreSQL 16 with PostGIS/pg_trgm, Python 3.12, FastAPI, Mapbox GL JS, Google Identity Services, Docker Compose.

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
- Use Drizzle Kit's generated SQL migration history; use named custom migrations for PostGIS extensions, `geography(Point, 4326)`, GiST, GIN, and `pg_trgm` details that are not represented safely by the TypeScript schema.
- Never use `drizzle-kit push` for shared or production environments. Use `db:generate`, inspect SQL, run `db:check`, then apply with `db:migrate`.
- Every resource guide must include prerequisites, account/install steps, key acquisition where applicable, environment variables, integration steps, verification, troubleshooting, least privilege, rotation/revocation, official references, and a last-verified date.
- `docs/resources/dependency-catalog.md` must list every direct runtime/development dependency, its pinned version, owner, purpose, official documentation, license, and whether it requires credentials.
- Mermaid diagrams are source-controlled documentation. They must reflect implemented API names, service boundaries, status transitions, failure paths, and the rule that bank policies never become merchant observations.
- Official Meta documentation removed the Facebook Groups API from all versions on April 22, 2024. Facebook group ingestion is therefore capability-gated: do not implement or document an unsupported workaround, UI scraper, browser automation, or token-acquisition bypass.
- The repository already exists. End each task with a scoped commit after its manual verification passes.

---

## File Structure

```text
package.json                              workspace scripts
pnpm-workspace.yaml                       workspace membership
docker-compose.yml                        local PostgreSQL + PostGIS
.env.example                              non-secret environment contract
apps/api/
  drizzle.config.ts                       Drizzle Kit schema/migration configuration
  drizzle/                                generated and custom SQL migration history
  src/domain/                             pure entities, enums, value objects
  src/application/                        use cases and ports
  src/infrastructure/database/schema/     Drizzle table, enum, relation definitions
  src/infrastructure/                     Drizzle, OAuth, HTTP and job adapters
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
docs/resources/README.md                  ordered onboarding and readiness checklist
docs/resources/dependency-catalog.md      all direct dependencies and service credentials
docs/resources/local-development.md       Node.js, pnpm, Python and Docker setup
docs/resources/application-frameworks.md  Next.js, NestJS and FastAPI setup
docs/resources/database-and-drizzle.md    PostgreSQL/PostGIS/Drizzle workflow
docs/resources/mapbox.md                  token setup and browser-map integration
docs/resources/google-oauth.md            Google Identity Services setup
docs/resources/facebook-graph-api.md      capability status, permissions and compliance
docs/resources/llm-providers.md           Gemini/Groq/OpenRouter setup and fallback
docs/architecture/system-overview.md      context, container and deployment diagrams
docs/architecture/feature-flows.md        search, report, review, ingestion and lifecycle
docs/manual-verification.md               repeatable MVP smoke checklist
```

## Documentation Contract

Each guide begins with `Last verified: YYYY-MM-DD` using the execution date and links only to official vendor/project documentation for setup claims. Credential examples use placeholders such as `<GEMINI_API_KEY>` and never include real values.

The resource hub presents this order:

1. Install local tooling.
2. Install workspace dependencies and understand the application frameworks.
3. Start PostgreSQL/PostGIS and apply Drizzle migrations.
4. Configure Google Identity Services.
5. Configure Mapbox.
6. Configure Gemini, Groq, and OpenRouter.
7. Run the Facebook capability gate.
8. Start all services and execute the manual readiness checklist.

The dependency catalog is updated in the same task that adds or removes a direct package or external service. It is not deferred to release cleanup.

## Delivery Flow

```mermaid
flowchart LR
    bootstrap["1. Workspace + local resources"] --> database["2-3. Drizzle + core schema"]
    database --> auth["4. Google auth"]
    database --> reports["5. Reports + review"]
    database --> search["6. Public search"]
    reports --> internal["7. Sources + Internal API"]
    internal --> worker["8. Python worker"]
    worker --> llm["9. LLM + bank policies"]
    llm --> facebook["10. Facebook capability gate"]
    search --> publicWeb["11. Map-first web"]
    auth --> productWeb["12. Report/store/admin web"]
    reports --> productWeb
    internal --> productWeb
    facebook --> release["13. Operations, diagrams, acceptance"]
    publicWeb --> release
    productWeb --> release
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
- Create: `docs/resources/README.md`
- Create: `docs/resources/dependency-catalog.md`
- Create: `docs/resources/local-development.md`
- Create: `docs/resources/application-frameworks.md`
- Create: `docs/manual-verification.md`

**Produces:** Repeatable local startup for PostGIS, the API, web, and ingestion services plus the resource hub, dependency catalog, and framework/tooling onboarding guides. Environment names are the sole contract for secrets.

- [ ] **Step 1: Create workspace membership and root scripts.**

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
```

```json
{
  "private": true,
  "packageManager": "pnpm@11.0.0",
  "scripts": {
    "dev": "pnpm --parallel --stream dev",
    "build": "pnpm --recursive build",
    "lint": "pnpm --recursive lint",
    "typecheck": "pnpm --recursive typecheck",
    "verify": "pnpm lint && pnpm typecheck && pnpm build"
  }
}
```

Scaffold the TypeScript applications with their official CLIs, then remove generated Git metadata if a scaffold attempts to create nested repositories:

```powershell
pnpm dlx create-next-app@latest apps/web --typescript --eslint --app --no-src-dir --use-pnpm --import-alias "@/*"
pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --skip-git --strict
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

- [ ] **Step 3: Define the environment contract.** Add exactly these names with empty values and comments describing where each value is used:

```dotenv
DATABASE_URL=postgresql://mcc:mcc_local_only@localhost:5432/mcc
INTERNAL_API_KEY=
SESSION_SECRET=
REVALIDATION_SECRET=
GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ADMIN_EMAIL_ALLOWLIST=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
GEMINI_API_KEY=
GEMINI_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_INGESTION_MODE=disabled
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WEB_ORIGIN=http://localhost:3000
```

- [ ] **Step 4: Write the ordered local-development guide.** Use [Node.js downloads](https://nodejs.org/en/download), [pnpm installation](https://pnpm.io/installation), [Python on Windows](https://docs.python.org/3/using/windows.html), and [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) as official references. Include these executable checkpoints:

```powershell
node --version
npm install --global corepack@latest
corepack enable pnpm
corepack install
pnpm --version
py -3.12 --version
docker version
docker compose version
pnpm install
docker compose up -d db
docker compose exec db pg_isready -U mcc -d mcc
```

Document Windows/WSL 2 as the primary path, link to official macOS/Linux installation pages, and explain how to stop the stack without deleting the named database volume.

- [ ] **Step 5: Write the framework guide and initial dependency catalog.** Use the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation), [NestJS first steps](https://docs.nestjs.com/first-steps), and [FastAPI first steps](https://fastapi.tiangolo.com/tutorial/first-steps/). Explain how the monorepo separates Next.js, NestJS, and FastAPI; include the scaffold commands above plus each service's start/build/typecheck command; and show the allowed dependency direction:

```mermaid
flowchart LR
    web["Next.js"] --> api["NestJS HTTP API"]
    ingestion["FastAPI worker"] --> internal["NestJS Internal API"]
    api --> application["Application ports/use cases"]
    application --> domain["Domain"]
    api --> adapters["Infrastructure adapters"]
```

Initialize `dependency-catalog.md` with Node.js, pnpm, TypeScript, Next.js, NestJS, Python, FastAPI, Docker Compose, PostgreSQL, PostGIS, and `pg_trgm`. Use columns `Dependency`, `Pinned version`, `Layer/owner`, `Purpose`, `Official docs`, `License`, and `Credential/env`.

- [ ] **Step 6: Create the manual verification document.** Start it with the commands above, the future Drizzle migration command `pnpm --filter api db:migrate`, startup commands for all services, and an unchecked section for every later task.

- [ ] **Step 7: Verify manually.** Follow `docs/resources/README.md` from a clean shell, confirm `pg_isready` succeeds, and run each scaffold's `build`, `typecheck`, and `lint` commands.

- [ ] **Step 8: Commit.**

```powershell
git add package.json pnpm-workspace.yaml docker-compose.yml .env.example apps/api/package.json apps/web/package.json services/ingestion/pyproject.toml docs/resources docs/manual-verification.md
git commit -m "chore: bootstrap workspace and onboarding resources"
```

### Task 2: Establish NestJS Clean Architecture and database infrastructure

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/domain/shared/domain-error.ts`
- Modify: `apps/api/package.json`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/infrastructure/database/database.constants.ts`
- Create: `apps/api/src/infrastructure/database/database.types.ts`
- Create: `apps/api/src/infrastructure/database/database.provider.ts`
- Create: `apps/api/src/infrastructure/database/database.module.ts`
- Create: `apps/api/src/infrastructure/database/migrate.ts`
- Create: `apps/api/src/infrastructure/database/schema/index.ts`
- Create: `apps/api/src/presentation/http/health.controller.ts`
- Create: `apps/api/drizzle/0000_extensions.sql`
- Create: `docs/resources/database-and-drizzle.md`
- Modify: `docs/resources/dependency-catalog.md`

**Produces:** A Core API that starts, exposes `/health`, loads configuration, and owns all PostgreSQL access.

- [ ] **Step 1: Create the NestJS bootstrap with global input rules.** Enable CORS only for `NEXT_PUBLIC_WEB_ORIGIN`, global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, and a global error filter mapping domain errors to stable HTTP responses.

- [ ] **Step 2: Install and configure Drizzle.**

```ts
// apps/api/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
```

Add `drizzle-orm` and `pg` as runtime dependencies; add `drizzle-kit` and `@types/pg` as development dependencies. Add package scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:check": "drizzle-kit check",
  "db:migrate": "tsx src/infrastructure/database/migrate.ts",
  "db:studio": "drizzle-kit studio"
}
```

```ts
// apps/api/src/infrastructure/database/migrate.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: './drizzle' });
await pool.end();
```

- [ ] **Step 3: Register one NestJS database provider.**

```ts
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export const databaseProvider = {
  provide: DRIZZLE_DB,
  inject: [ConfigService],
  useFactory: (config: ConfigService): AppDatabase => {
    const pool = new Pool({ connectionString: config.getOrThrow('DATABASE_URL') });
    return drizzle(pool, { schema });
  },
};
```

`AppDatabase` is `NodePgDatabase<typeof schema>`. Only infrastructure files may import this type or the `DRIZZLE_DB` token. The database module must retain the `Pool` and close it during NestJS application shutdown.

- [ ] **Step 4: Add the first named custom SQL migration.**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

- [ ] **Step 5: Add `GET /health`.** Execute `sql\`select 1\`` through the injected Drizzle database. Return `{ "status": "ok" }` only after it succeeds; return HTTP 503 when connectivity fails without exposing the connection string.

- [ ] **Step 6: Write the database/Drizzle resource guide.** Use [Drizzle with node-postgres](https://orm.drizzle.team/docs/get-started/postgresql-new), [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [Drizzle custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations), and the official PostgreSQL/PostGIS documentation. Include:

1. Start PostgreSQL and verify `pg_isready`.
2. Explain the local `DATABASE_URL` and how production supplies it from secret management.
3. Install Drizzle packages and explain the schema/output paths.
4. Run `db:generate`, inspect generated SQL, run `db:check`, and run `db:migrate`.
5. Create extension SQL with `drizzle-kit generate --custom --name=extensions` and spatial/index SQL with `drizzle-kit generate --custom --name=spatial_search`.
6. Verify `SELECT PostGIS_Version()` and `SELECT extversion FROM pg_extension WHERE extname = 'pg_trgm'`.
7. Explain rollback policy: restore/forward-fix in production; never edit an applied migration.
8. Troubleshoot missing extensions, wrong schema paths, connection refusal, and migration hash/history drift.

- [ ] **Step 7: Update the dependency catalog.** Add `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`, PostgreSQL 16, PostGIS, and `pg_trgm` with exact installed versions and official documentation.

- [ ] **Step 8: Verify manually.** Run `pnpm --filter api db:check`, apply the migration, call `/health`, stop PostgreSQL, and confirm the endpoint returns 503 without exposing a connection string.

- [ ] **Step 9: Commit.**

```powershell
git add apps/api docs/resources
git commit -m "feat: add Drizzle database infrastructure"
```

### Task 3: Model merchants, locations, MCC observations, provenance, and audit history

**Files:**
- Create: `apps/api/src/infrastructure/database/schema/enums.ts`
- Create: `apps/api/src/infrastructure/database/schema/auth.schema.ts`
- Create: `apps/api/src/infrastructure/database/schema/merchant.schema.ts`
- Create: `apps/api/src/infrastructure/database/schema/source.schema.ts`
- Create: `apps/api/src/infrastructure/database/schema/relations.ts`
- Modify: `apps/api/src/infrastructure/database/schema/index.ts`
- Create: `apps/api/drizzle/0001_mcc_core.sql`
- Create: `apps/api/drizzle/0002_spatial_search.sql`
- Create: `apps/api/src/domain/observation/observation-status.ts`
- Create: `apps/api/src/domain/observation/confidence.ts`
- Create: `apps/api/src/application/ports/merchant.repository.ts`
- Create: `apps/api/src/application/ports/observation.repository.ts`
- Create: `apps/api/src/infrastructure/database/drizzle-merchant.repository.ts`
- Create: `apps/api/src/infrastructure/database/drizzle-observation.repository.ts`
- Modify: `docs/resources/dependency-catalog.md`

**Consumes:** `AppDatabase` and `DRIZZLE_DB` from Task 2.

**Produces:** The persistence and domain contract required by reports, ingestion, admin review, search, and SEO pages.

- [ ] **Step 1: Define Drizzle enums, tables, foreign keys, and relations for `User`, `Merchant`, `MerchantLocation`, `MerchantAlias`, `MccCode`, `MccObservation`, `Source`, `SourceItem`, `IngestionJob`, `BankDocument`, `BankMccPolicy`, and `AuditLog`.** Use explicit snake_case PostgreSQL names, `pgEnum` for statuses/channels/source types, UTC timestamps, and a required source foreign key for every observation.

- [ ] **Step 2: Generate the relational migration, inspect it, then add the named spatial-search custom migration.**

```sql
CREATE INDEX merchant_location_geo_gist ON merchant_location USING GIST (geo);
CREATE INDEX merchant_alias_name_trgm ON merchant_alias USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX merchant_name_trgm ON merchant USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX observation_public_lookup ON mcc_observation (status, mcc_code_id, merchant_location_id);
```

Represent `geo geography(Point, 4326)` in the Drizzle schema with a `customType` whose driver value is WKT/EWKT, so the generated `mcc_core` migration creates the column. Repository writes must use `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.

Run:

```powershell
pnpm --filter api db:generate -- --name=mcc_core
pnpm --filter api exec drizzle-kit generate --custom --name=spatial_search
pnpm --filter api db:check
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

- [ ] **Step 4: Implement repositories so public methods hard-code `status = 'approved'`; admin methods expose explicit status filters.** Keep atomic review/merge operations inside repository methods and use `db.transaction(...)` so observation, alias/location movement, and `audit_log` writes commit or roll back together.

- [ ] **Step 5: Verify manually.** Insert one merchant, one location with a valid WGS84 point, one approved observation, and one staging observation; inspect the index list and confirm the public repository returns only the approved record.

- [ ] **Step 6: Run API verification and update the catalog if any direct package changed.**

```powershell
pnpm --filter api db:check
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter api build
```

- [ ] **Step 7: Commit.**

```powershell
git add apps/api docs/resources/dependency-catalog.md
git commit -m "feat: model MCC data with Drizzle"
```

### Task 4: Add Google authentication and the single Admin boundary

**Files:**
- Create: `apps/api/src/application/auth/sign-in-with-google.use-case.ts`
- Create: `apps/api/src/application/auth/session.port.ts`
- Modify: `apps/api/package.json`
- Create: `apps/api/src/infrastructure/auth/google-token-verifier.ts`
- Create: `apps/api/src/infrastructure/auth/jwt-session.adapter.ts`
- Create: `apps/api/src/presentation/http/auth/auth.controller.ts`
- Create: `apps/api/src/presentation/http/auth/current-user.decorator.ts`
- Create: `apps/api/src/presentation/http/auth/auth.guard.ts`
- Create: `apps/api/src/presentation/http/auth/admin.guard.ts`
- Create: `docs/resources/google-oauth.md`
- Modify: `docs/resources/dependency-catalog.md`

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

- [ ] **Step 2: Install `google-auth-library` and `jose`, then implement `POST /auth/google`.** Verify the Google ID token with `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`, upsert the local user by Google subject, split `ADMIN_EMAIL_ALLOWLIST` on commas, assign `admin` only on an exact case-insensitive email match, and return a short-lived API session through an HTTP-only secure cookie in production.

- [ ] **Step 3: Add guards.** `AuthGuard` requires a valid API session; `AdminGuard` first invokes `AuthGuard`, then checks both session role and the current allowlist so removing an email takes effect immediately.

- [ ] **Step 4: Add `GET /auth/me` for web hydration.** Return id, display name, and role; never return Google token material.

- [ ] **Step 5: Write the Google Identity Services guide.** Use the official [web setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) and [ID-token verification guide](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token). Document this exact console flow:

1. Create or select a Google Cloud project.
2. Configure Google Auth Platform `Branding`, `Audience`, and `Data Access`.
3. Request only `openid`, `email`, and `profile`.
4. Create an `OAuth client ID` with application type `Web application`.
5. Add `http://localhost:3000` and the production web origin to Authorized JavaScript origins.
6. Copy the client ID to both `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
7. Do not add or consume a client secret for the GIS ID-token handoff used by this MVP.
8. Explain how to disable/delete the OAuth client, update allowed origins, and diagnose `origin_mismatch`, invalid audience, popup/third-party-cookie issues, and clock skew.

- [ ] **Step 6: Verify manually.** Sign in with an allowlisted email and a non-allowlisted email; verify both can report, only the allowlisted email can call an Admin route, and removing an allowlist entry denies the next Admin request.

- [ ] **Step 7: Update the dependency catalog and commit.**

```powershell
git add apps/api docs/resources
git commit -m "feat: add Google authentication boundary"
```

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

- [ ] **Step 6: Commit.**

```powershell
git add apps/api
git commit -m "feat: add community reports and admin review"
```

### Task 6: Implement public MCC and merchant search with PostGIS and fuzzy matching

**Files:**
- Create: `apps/api/src/application/search/search-merchants.use-case.ts`
- Create: `apps/api/src/application/search/get-store-detail.use-case.ts`
- Modify: `apps/api/src/infrastructure/database/drizzle-merchant.repository.ts`
- Create: `apps/api/src/presentation/http/search/search.controller.ts`
- Create: `apps/api/src/presentation/http/search/dto/search-query.dto.ts`
- Create: `apps/api/src/presentation/http/search/dto/store-detail.dto.ts`

**Consumes:** `MerchantSearchPort` from Task 3.

**Produces:** `GET /mcc-codes`, `GET /categories`, `GET /search`, and `GET /stores/:slug`.

- [ ] **Step 1: Validate the search query.** Accept optional text query, MCC, category, latitude/longitude pair, radius 1–50 km, page at least 1, and page size 1–50. Reject a lone latitude or longitude.

- [ ] **Step 2: Use parameterized SQL for ranked text and geo results.**

```ts
const normalizedQuery = input.query?.trim().toLocaleLowerCase('vi') || null;
const mccCode = input.mccCode ?? null;
const latitude = input.latitude ?? null;
const longitude = input.longitude ?? null;
const radiusMeters = input.radiusKm ? input.radiusKm * 1_000 : null;

const publicSearchFilter = sql`
  WHERE o.status = 'approved'
    AND (
      ${normalizedQuery}::text IS NULL
      OR similarity(ma.normalized_name, ${normalizedQuery}) > 0.18
    )
    AND (${mccCode}::text IS NULL OR mcc.code = ${mccCode})
    AND (
      ${latitude}::double precision IS NULL
      OR ST_DWithin(
        ml.geo,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
    )
`;
```

Use this fragment inside both the result and count queries. All user values must be `${...}` parameters in Drizzle's `sql` template; do not use `sql.raw` for request data.

- [ ] **Step 3: Group results by location.** Return canonical name, address, coordinates, distance when available, highest-confidence matching observation, and all matching approved channels in a typed response.

- [ ] **Step 4: Implement store detail.** Resolve the canonical slug, return 404 for hidden/inactive location only, and expose source display name, observed date, channel, issuer bank/card network when known, and confidence without exposing raw social content.

- [ ] **Step 5: Verify manually.** Check exact, misspelled, MCC-only, category-only, and coordinates-plus-radius searches; inspect query plan for GiST/GIN use; load 100,000 representative rows and record response time for a 5 km query.

- [ ] **Step 6: Commit.**

```powershell
git add apps/api
git commit -m "feat: add PostGIS merchant search"
```

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

- [ ] **Step 1: Implement source registry fields.** Require unique `sourceKey`, type (`community`, `facebook`, `bank`), display name, schedule, enabled state, retention days, and a non-secret external identifier/URL. Do not store tokens in the database. New Facebook sources default to disabled until Task 10 records a `SUPPORTED` capability decision.

- [ ] **Step 2: Protect Internal API.** Compare the `X-API-KEY` header against `INTERNAL_API_KEY` with timing-safe equality; return 401 for absent/incorrect keys and never describe the expected value.

- [ ] **Step 3: Validate and idempotently receive normalized observations.** Build the idempotency key from source key and external item ID, create or update `SourceItem`, and create staging observation candidates only. If the source is disabled, return a stable ignored result and create no observation.

- [ ] **Step 4: Track jobs.** Admin can start a named job, see count and timestamps, finish it as `succeeded`/`failed`, and rerun a source by creating a new job record rather than overwriting history.

- [ ] **Step 5: Verify manually.** Create a Facebook source as Admin, call Internal API with bad and good keys, submit the same payload twice, confirm one source item/candidate exists, disable the source, and confirm the next payload is ignored.

- [ ] **Step 6: Commit.**

```powershell
git add apps/api
git commit -m "feat: add protected ingestion API"
```

### Task 8: Scaffold Python ingestion with redaction, extraction, and delivery ports

**Files:**
- Create: `services/ingestion/app/main.py`
- Modify: `services/ingestion/pyproject.toml`
- Create: `services/ingestion/app/domain/models.py`
- Create: `services/ingestion/app/application/redact_pii.py`
- Create: `services/ingestion/app/application/extract_candidate.py`
- Create: `services/ingestion/app/application/deliver_candidate.py`
- Create: `services/ingestion/app/application/ports.py`
- Create: `services/ingestion/app/infrastructure/internal_api_client.py`
- Create: `services/ingestion/app/infrastructure/settings.py`
- Modify: `docs/resources/application-frameworks.md`
- Modify: `docs/resources/dependency-catalog.md`

**Consumes:** `NormalizedObservationInput` from Task 7.

**Produces:** A running FastAPI worker that has no direct PostgreSQL dependency and can safely send a normalized candidate to NestJS.

- [ ] **Step 1: Add `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`, and `httpx` to `pyproject.toml`, then define Python models and ports.**

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

- [ ] **Step 6: Complete the FastAPI section of the framework guide.** Include Python 3.12 virtual-environment creation, dependency installation from `pyproject.toml`, settings loading, `uvicorn` startup, health verification, and the rule that the worker receives no `DATABASE_URL`.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e services/ingestion
python -m uvicorn app.main:app --app-dir services/ingestion --host 127.0.0.1 --port 8000
Invoke-RestMethod http://127.0.0.1:8000/health
```

- [ ] **Step 7: Update the dependency catalog and commit.**

```powershell
git add services/ingestion docs/resources
git commit -m "feat: scaffold ingestion worker"
```

### Task 9: Add strict-schema LLM fallback and bank-document ingestion

**Files:**
- Create: `services/ingestion/app/application/llm_fallback.py`
- Create: `services/ingestion/app/infrastructure/gemini_client.py`
- Create: `services/ingestion/app/infrastructure/groq_client.py`
- Create: `services/ingestion/app/infrastructure/openrouter_client.py`
- Create: `services/ingestion/app/infrastructure/bank_document_fetcher.py`
- Create: `services/ingestion/app/application/ingest_bank_document.py`
- Modify: `services/ingestion/pyproject.toml`
- Create: `apps/api/src/application/ingestion/receive-bank-policy.use-case.ts`
- Create: `apps/api/src/presentation/http/internal/dto/bank-policy.dto.ts`
- Create: `docs/resources/llm-providers.md`
- Modify: `docs/resources/dependency-catalog.md`

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

- [ ] **Step 2: Add `google-genai` and `groq` to `pyproject.toml`, reuse `httpx` for OpenRouter, and implement waterfall behavior.** Call Gemini first; on quota, timeout, malformed JSON, or schema rejection call Groq; then OpenRouter. If all fail, mark the job failed with provider names and a non-sensitive reason; do not send a partial policy.

- [ ] **Step 3: Fetch only configured bank URLs and hash normalized document bytes.** If the latest successful hash matches, record a no-change job and skip extraction. Treat HTTP 4xx/5xx as a failed source job.

- [ ] **Step 4: Add a separate Internal API endpoint for bank policies.** Persist `BankDocument` and `BankMccPolicy`; prohibit this endpoint from writing `MccObservation`.

- [ ] **Step 5: Write the LLM provider setup guide.** Use [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [Groq quickstart](https://console.groq.com/docs/quickstart), and [OpenRouter quickstart](https://openrouter.ai/docs/quickstart) as official references. Document these provider-specific flows:

**Gemini**

1. Open Google AI Studio and create or import an API key for the intended Google Cloud project.
2. Store the value only as `GEMINI_API_KEY`.
3. Select a currently available model that supports the required text/JSON behavior and store its exact ID in `GEMINI_MODEL`.
4. Make one redacted, non-sensitive schema-validation request and record quota/rate-limit behavior.
5. Revoke the key from the Google AI Studio/API-key management page when rotating it.

**Groq**

1. Create a GroqCloud account, open `API Keys`, and create a key for this service.
2. Store it as `GROQ_API_KEY`; store the selected model ID as `GROQ_MODEL`.
3. Verify one request through the project's strict Pydantic validation path.
4. Delete the old key after rotation and confirm the worker reports a sanitized authentication failure.

**OpenRouter**

1. Create an OpenRouter account, open `Keys`, and create a named key.
2. Store it as `OPENROUTER_API_KEY`; store the chosen model ID as `OPENROUTER_MODEL`.
3. Document any configured credit limit and whether the project sends OpenRouter's optional application-identification headers.
4. Verify one request through the same Pydantic schema and delete the key during rotation.

For all providers, explain that model availability and free-tier limits are changeable external state, model IDs are configuration rather than source constants, prompts never contain raw PII, and logs include provider/status only.

- [ ] **Step 6: Verify manually.** Run a configured document once, run it again unchanged, simulate invalid JSON and quota/auth failures at each provider, and inspect that a policy can be created but no public merchant search result changes.

- [ ] **Step 7: Update the dependency catalog and commit.**

```powershell
git add apps/api services/ingestion docs/resources
git commit -m "feat: add LLM fallback and bank policy ingestion"
```

### Task 10: Run the Facebook group capability gate and implement only supported access

**Files:**
- Create: `docs/resources/facebook-graph-api.md`
- Create: `docs/decisions/0001-facebook-group-ingestion.md`
- Create: `services/ingestion/app/infrastructure/facebook_client.py`
- Create: `services/ingestion/app/application/ingest_facebook_source.py`
- Create: `services/ingestion/app/application/scheduler.py`
- Modify: `services/ingestion/app/main.py`
- Modify: `docs/resources/dependency-catalog.md`
- Modify: `docs/manual-verification.md`

**Consumes:** source registry from Task 7 and redaction/LLM/delivery from Tasks 8–9.

**Produces:** A documented, reproducible provider-capability decision. It produces scheduled Facebook ingestion only when the project owner can demonstrate a currently supported official Meta API/product, required permissions, App Review approval, and authorized group access.

- [ ] **Step 1: Record the current official baseline.** The ADR and resource guide must state that Meta's Graph API v19 changelog removed the Facebook Groups API from all versions on April 22, 2024. Link the official [Graph API v19 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0/) and record the execution-date result of searching current Meta products, permissions, and App Review features.

- [ ] **Step 2: Require evidence before writing an adapter.** Record all of the following in the ADR:

1. Official Meta product/API name and current version.
2. Official endpoint for group posts and comments.
3. Required permissions/features and whether App Review is required.
4. Proof that the app and project owner are authorized for the target group.
5. Token type, expiry, refresh/rotation path, and least-privilege scope.
6. A successful request made with owner-provided test credentials, with IDs/content redacted from the ADR.

If any item is missing, set the ADR decision to `BLOCKED`, leave the source disabled, implement the client as a no-network adapter returning `unsupported_provider_capability`, and request a spec amendment for a compliant replacement such as an operator-provided export/import flow.

- [ ] **Step 3: Implement the capability-aware client boundary.** For `SUPPORTED`, the adapter receives group ID, cursor, and API token from settings and returns typed post/comment records. For `BLOCKED`, it performs no network request and returns `unsupported_provider_capability`. Neither path may navigate Facebook HTML, download images, collect profiles, request broader permissions, or include a token in logs.

- [ ] **Step 4: Implement capability-aware processing and scheduling.** For `SUPPORTED`, concatenate post message and caption as one item; process each comment separately with its parent external ID; redact PII before filtering/LLM extraction; persist non-secret cursors; and create a job even when no candidate is found. For `BLOCKED`, skip scheduling and expose a stable unavailable state to the Admin API/UI.

- [ ] **Step 5: If and only if the gate passes, isolate provider failures.** Permission failure, expired token, rate limit, or missing API field marks that source job failed without stopping other sources.

- [ ] **Step 6: Write the setup guide according to the decision.**

- For `SUPPORTED`, include Meta app creation, product enablement, App Review, permission request, authorized-group setup, token acquisition/expiry/rotation, environment configuration, Graph API Explorer verification, integration commands, and error handling.
- For `BLOCKED`, include the removal date, the missing supported capability, prohibited workarounds, how to leave the source disabled, and the exact spec decision required before adopting a replacement source.

- [ ] **Step 7: Verify manually.** For `SUPPORTED`, inspect one authorized post and comment end-to-end: PII is redacted, images are ignored, the candidate reaches staging, approval remains required, and disabling the source stops delivery. For `BLOCKED`, confirm no Facebook job is scheduled, no adapter attempts network access, and the Admin API exposes a stable unavailable status rather than a failed job.

- [ ] **Step 8: Update the dependency catalog and commit the decision plus any supported implementation.**

```powershell
git add docs/resources/facebook-graph-api.md docs/decisions/0001-facebook-group-ingestion.md docs/resources/dependency-catalog.md docs/manual-verification.md services/ingestion
git commit -m "docs: record Facebook ingestion capability decision"
```

### Task 11: Build the Next.js map-first public search experience

**Files:**
- Create: `apps/web/app/page.tsx`
- Modify: `apps/web/package.json`
- Create: `apps/web/components/search/search-bar.tsx`
- Create: `apps/web/components/search/search-filters.tsx`
- Create: `apps/web/components/search/search-results.tsx`
- Create: `apps/web/components/map/merchant-map.tsx`
- Create: `apps/web/components/map/location-picker.tsx`
- Create: `apps/web/lib/api-client.ts`
- Create: `apps/web/lib/geolocation.ts`
- Create: `docs/resources/mapbox.md`
- Modify: `docs/resources/dependency-catalog.md`

**Consumes:** public endpoints from Task 6 and Mapbox token from Task 1.

**Produces:** Map-first desktop split view and mobile full-map/bottom-sheet search with an explicit non-GPS path.

- [ ] **Step 1: Add `mapbox-gl` to the web package and create a typed API client.**

```ts
export async function searchMerchants(input: SearchInput): Promise<SearchResponse> {
  const params = new URLSearchParams(removeUndefined(input));
  return fetchJson<SearchResponse>(`${API_BASE_URL}/search?${params}`, { cache: 'no-store' });
}
```

- [ ] **Step 2: Build the search controls.** Support text, MCC/category, channel, radius, province/city selector, and manual address. Request browser GPS only after the user presses “Tìm quanh đây”; a denied permission retains manual location controls.

- [ ] **Step 3: Render desktop map-first layout.** Keep Mapbox map visible beside a scrollable result list. Selecting a pin highlights the result; selecting a result flies to and opens its pin.

- [ ] **Step 4: Render mobile map-first layout.** Map occupies the viewport, results appear in a draggable bottom sheet, and map interaction remains available above the sheet.

- [ ] **Step 5: Write the Mapbox setup guide.** Use the official [access-token guide](https://docs.mapbox.com/help/getting-started/access-tokens/) and document:

1. Create or select a Mapbox account.
2. Create a separate public token for the web app rather than using a secret token.
3. Grant only scopes required to load styles/tiles and apply URL restrictions for `http://localhost:3000/*` plus production origins.
4. Store the public token as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; explain that the `NEXT_PUBLIC_` prefix exposes it to the browser and therefore it must remain a restricted public token.
5. Install `mapbox-gl`, import its CSS once, set `mapboxgl.accessToken`, and clean up map instances on unmount.
6. Verify style/tile requests in browser devtools and diagnose 401/403, URL restriction, CSP, WebGL, and billing/quota errors.
7. Rotate by creating and deploying a replacement token before deleting the old token.

- [ ] **Step 6: Verify manually.** Search without GPS using a province, reject the browser GPS prompt, search by typo and MCC, select pins/results in both directions, and verify empty results offer the report CTA.

- [ ] **Step 7: Update the dependency catalog and commit.**

```powershell
git add apps/web docs/resources
git commit -m "feat: add map-first public search"
```

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
- Modify: `docs/resources/google-oauth.md`
- Modify: `docs/resources/dependency-catalog.md`

**Consumes:** auth, report, review, source, and store APIs from Tasks 4–7.

**Produces:** SEO-ready store pages, authenticated reporting, and the single Admin workflow.

- [ ] **Step 1: Implement Google sign-in handoff.** Obtain Google credential in the browser, send it only to `POST /auth/google`, then hydrate UI from `/auth/me`; do not persist Google credentials in local storage.

- [ ] **Step 2: Build report form.** Require merchant/location, MCC, issuer bank, and channel; render server validation errors inline; after success show that the report is awaiting review.

- [ ] **Step 3: Build `stores/[slug]` with SSR/ISR.** Fetch store detail server-side, render canonical title/description, address, map coordinate, and observation table; return `notFound()` for API 404. Set a bounded revalidation interval and accept an authenticated on-demand revalidation request from API only.

- [ ] **Step 4: Build Admin pages.** Guard routes using `/auth/me`, present staging candidate/source/permalink and approve/reject/merge actions, and display source enabled state plus latest jobs. Capability-blocked sources must render as unavailable with the ADR reason, not as transient job failures. A non-admin must see a 403/redirect and no staging content.

- [ ] **Step 5: Verify manually.** Inspect page HTML without JavaScript for store name/MCC/address, submit report after Google sign-in, approve it from Admin, reload the store route, and ensure a normal user cannot load Admin content.

- [ ] **Step 6: Complete the browser half of the Google guide.** Show loading Google Identity Services, rendering the sign-in control, sending only the returned credential to `POST /auth/google`, hydrating from `/auth/me`, signing out of the local API session, and verifying no Google token is written to local storage.

- [ ] **Step 7: Update the dependency catalog and commit.**

```powershell
git add apps/web docs/resources
git commit -m "feat: add authenticated reporting and admin web"
```

### Task 13: Add operations, performance readiness, and release acceptance

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `docs/manual-verification.md`
- Create: `docs/operations.md`
- Create: `docs/architecture/system-overview.md`
- Create: `docs/architecture/feature-flows.md`
- Modify: `docs/resources/README.md`
- Modify: `docs/resources/dependency-catalog.md`
- Create: `apps/api/scripts/seed-mcc.ts`
- Create: `apps/api/scripts/seed-locations.ts`

**Consumes:** all previous tasks.

**Produces:** A documented local/production runbook, non-secret data seeding, health visibility, backups, system/feature diagrams, a complete resource hub, and a release checklist.

- [ ] **Step 1: Add production-shaped Compose profiles.** Provide separate `web`, `api`, and `ingestion` services, pass environment variables by name, configure health checks, and keep PostgreSQL data in a named volume.

- [ ] **Step 2: Implement seed scripts.** Seed MCC catalog and import only operator-provided location data from a local CSV with columns `merchant_name,address,province,latitude,longitude`. Reject invalid coordinates and report imported/rejected totals.

- [ ] **Step 3: Write operations runbook.** Include database backup/restore commands, forward-fix migration recovery, rotating `INTERNAL_API_KEY`, `SESSION_SECRET`, `REVALIDATION_SECRET`, OAuth client IDs, LLM keys, supported provider tokens, source disable procedure, worker recovery, and ISR revalidation failure recovery.

- [ ] **Step 4: Write `system-overview.md` with Mermaid diagrams.** Include:

1. System context: user, Admin, operators, external providers.
2. Containers: Next.js, NestJS, Python worker, PostgreSQL/PostGIS.
3. Clean Architecture dependency direction.
4. Local Docker Compose topology.
5. Production deployment and health-check topology.

- [ ] **Step 5: Write `feature-flows.md` with Mermaid diagrams.** Include:

1. Public search request and PostGIS/`pg_trgm` query.
2. Google sign-in and API-session creation.
3. Community report to staging.
4. Admin approve/reject/merge plus audit and ISR revalidation.
5. Facebook capability gate and, only when supported, social ingestion.
6. Bank document hash/no-change/policy path.
7. Gemini → Groq → OpenRouter fallback and schema rejection.
8. Observation lifecycle: `staging` → `approved`/`rejected`, then optional `hidden`.
9. Source disable behavior and failure isolation.

Use exact implemented route names and database status names. Keep bank-policy nodes separate from observation nodes.

- [ ] **Step 6: Complete the resource hub and dependency audit.** Link every guide from `docs/resources/README.md`, add a setup-completion checkbox for every dependency, verify every direct dependency appears once in the catalog, and confirm each credential variable appears in `.env.example`, its owning guide, and `docs/operations.md`.

- [ ] **Step 7: Complete the manual acceptance checklist.** Include data counts, 5,000/500 readiness checks, source/job health, Admin access, public search, SEO rendering, disabled-source behavior, 100,000-row PostGIS benchmark under 300 ms, resource-guide onboarding from a clean shell, and successful rendering of every Mermaid block.

- [ ] **Step 8: Verify manually.** Start all services from a clean local database, import a sample CSV, run one bank source, run the documented Facebook decision path, approve observations, exercise the public flow, perform a backup and restore in a non-production database, preview all Mermaid diagrams, and record benchmark/onboarding results in the checklist.

If the Facebook ADR is `BLOCKED` and no user-approved replacement spec exists, record the release as incomplete; do not waive or silently remove the social-ingestion completion criterion.

- [ ] **Step 9: Commit.**

```powershell
git add docker-compose.yml .env.example apps/api/scripts docs/operations.md docs/manual-verification.md docs/resources docs/architecture
git commit -m "docs: complete operations resources and release acceptance"
```

## Plan Self-Review

### Spec coverage

- Map-first desktop/mobile, manual location, Mapbox, SEO store pages, fuzzy search, PostGIS and latency: Tasks 3, 6, 11, 12, 13.
- Google OAuth, one Admin role, environment allowlist, community reports and Admin staging approval: Tasks 4 and 5.
- Clean Architecture, Drizzle/node-postgres persistence, service separation, DTO-only Internal API and no Python database access: Tasks 2, 3, 7, and 8.
- Facebook capability verification, supported-access-only behavior, no scraping/image processing, source control and privacy redaction: Tasks 7, 8, and 10.
- Eight-bank document policy ingestion and free-tier LLM waterfall: Task 9.
- Idempotency, audit history, source disable/hidden data, health, backup, and manual acceptance: Tasks 5, 7, 10, and 13.
- Local tooling, frameworks, database, Google, Mapbox, LLM, Facebook setup guides, full dependency catalog, and credential rotation: Tasks 1, 2, 4, 8, 9, 10, 11, 12, and 13.
- System, deployment, search, authentication, reporting, review, ingestion, fallback, and lifecycle diagrams: Task 13.
- Explicitly excluded card recommendation, OCR, non-Facebook social sources, multi-admin roles, and automated tests: Global Constraints.

### Consistency checks

- The spec and plan both use Drizzle ORM/Kit with `node-postgres`; no legacy ORM artifact or command remains.
- Drizzle-generated migrations own relational schema; named custom migrations own extensions and specialized spatial/fuzzy indexes.
- All ingestion writes use `NormalizedObservationInput` or the separate bank-policy endpoint, both guarded by `X-API-KEY`.
- Only Tasks 5 and 7 create observations; both create staging records, so no ingestion path bypasses Admin approval.
- Search uses only `approved` observations as established in Task 3 and implemented in Task 6.
- All frontend consumers use API endpoints introduced by prior tasks.
- `BankDocument`/`BankMccPolicy` never enter the observation lifecycle or public merchant search.
- A `BLOCKED` Facebook decision leaves the source disabled and the release incomplete until a user-approved replacement spec exists.
- Every credential in `.env.example` has one owning resource guide and an operations rotation/revocation procedure.
