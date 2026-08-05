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

- [ ] Add later task-specific verification sections here as their briefs are introduced.
