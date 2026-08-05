# Manual Verification

Run these commands from the repository root unless a section says otherwise.

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

## Later-Task Startup Commands

Run these only after the referenced task has added the required code and configuration:

```powershell
pnpm --filter api db:migrate
pnpm --filter api dev
pnpm --filter web dev
python -m uvicorn app.main:app --reload --port 8000
```

## Task 1: Workspace Bootstrap

- [ ] Note the local verification environment: Node.js `v24.18.1`, Docker Compose `v5.3.1`, and Python `3.14.6` with the project still requiring Python `3.12`.
- [ ] Confirm the local PostGIS container starts and responds to `pg_isready`.
- [ ] Confirm `pnpm --filter api build` succeeds.
- [ ] Confirm `pnpm --filter api typecheck` succeeds.
- [ ] Confirm `pnpm --filter api lint` succeeds.
- [ ] Confirm `pnpm --filter web build` succeeds.
- [ ] Confirm `pnpm --filter web typecheck` succeeds.
- [ ] Confirm `pnpm --filter web lint` succeeds.

## Later Tasks

## Task 2: Drizzle Database Infrastructure

- [ ] Run `pnpm --filter api db:check` with `DATABASE_URL` configured.
- [ ] Start Docker Desktop's Linux engine, then run `docker compose up -d db`.
- [ ] Run `pnpm --filter api db:migrate`.
- [ ] Confirm `SELECT PostGIS_Version()` and the `pg_trgm` extension query both return values.
- [ ] Start the API with a valid database connection and confirm `GET /health` returns `200 {"status":"ok"}`.
- [ ] Stop PostgreSQL and confirm `GET /health` returns HTTP 503 without a connection string or stack trace.

## Task 4: Google Authentication and Admin Boundary

- [ ] Configure Google Identity Services using [google-oauth.md](resources/google-oauth.md).
- [ ] Sign in with an allowlisted email and a non-allowlisted email; confirm both receive an MCC session.
- [ ] Confirm `GET /auth/me` returns local id, display name, and role without Google token material.
- [ ] Confirm only the allowlisted email can call an Admin endpoint once one is available.
- [ ] Remove an allowlist entry and confirm the next Admin request returns HTTP 403.
- [ ] Confirm `POST /auth/logout` clears the MCC session and `GET /auth/me` then returns HTTP 401.

## Task 5: Community Reports and Admin Review

- [ ] Submit a report as a normal authenticated user and confirm it creates a `staging` observation with the `community` source.
- [ ] Submit the same user/merchant/MCC/channel report within seven days and confirm it returns the existing observation as a duplicate.
- [ ] Confirm an unknown or non-four-digit MCC is rejected before the report use case runs.
- [ ] Confirm a staging report is absent from public search once search is available.
- [ ] As Admin, reject without a reason and confirm validation fails; reject with a reason and inspect the audit entry.
- [ ] Confirm an offline observation cannot be approved until its location has WGS84 coordinates.
- [ ] Approve a geocoded report, then hide it; confirm its audit history remains.
- [ ] Merge two locations and confirm aliases and observations move together without deleting source data.

## Task 10: Facebook Group Capability Gate

- [ ] Read [ADR 0001](decisions/0001-facebook-group-ingestion.md) and confirm it is `BLOCKED` because Meta removed the Facebook Groups API from all Graph API versions on April 22, 2024 and no owner-supplied official-access evidence exists.
- [ ] Confirm `FACEBOOK_INGESTION_MODE=disabled` and that `FACEBOOK_ACCESS_TOKEN` is empty in the local environment.
- [ ] From `services/ingestion`, start the worker with `py -3.12 -m uvicorn app.main:app --port 8000`.
- [ ] Call `GET /facebook/capability` and confirm HTTP 200 with `status: "unsupported_provider_capability"`, `capability: "blocked"`, `scheduling: "skipped"`, and `jobCreated: false`.
- [ ] Run the following no-network adapter check and confirm it prints `unsupported_provider_capability`:

```powershell
Push-Location services/ingestion
$env:PYTHONPATH = (Get-Location).Path
@'
import asyncio
from app.infrastructure.facebook_client import FacebookClient

result = asyncio.run(
    FacebookClient().fetch_group_items(group_id="redacted", cursor=None)
)
assert result.status == "unsupported_provider_capability"
assert result.items == ()
print(result.status)
'@ | py -3.12 -
Pop-Location
```

- [ ] Confirm no Facebook source job is scheduled or created, and that no Facebook request, browser automation, scraping, image processing, profile collection, or token logging occurs.
- [ ] Confirm the only permitted next step is a user-approved specification amendment for a compliant replacement source, unless all required official Meta evidence is supplied and a new ADR is approved.

## Task 9: Bank Policy Ingestion

- [ ] Configure one bank source with an operator-approved document URL, then submit its policy through `POST /internal/ingestion/bank-policies`.
- [ ] Run the same document hash twice and confirm the second request returns `no_change`.
- [ ] Simulate malformed JSON, timeout, quota, and auth failures; confirm Gemini, Groq, then OpenRouter are attempted without sending a partial policy.
- [ ] Confirm `BankDocument` and `BankMccPolicy` rows exist while public `/search` results remain unchanged.

## Task 11: Map Search

- [ ] Search by MCC, a misspelled merchant name, category, and a 1-50 km coordinate radius.
- [ ] Reject browser GPS permission and confirm the manual location control remains usable.
- [ ] Select a result and its map pin in both directions, then confirm an empty result offers the report action.

## Task 13: Release Acceptance

- [ ] Run `pnpm --filter api seed:mcc`, import an operator CSV, and record imported/rejected totals.
- [ ] Confirm 5,000 geocoded locations and 500 approved observations before an MVP release decision.
- [ ] Record a 100,000-row 5 km PostGIS benchmark under 300 ms.
- [ ] Perform a backup and restore against a non-production database.
- [ ] Render every Mermaid diagram and complete each resource guide from a clean shell.
- [ ] Record release as incomplete while ADR 0001 remains `BLOCKED` without a user-approved replacement source.
