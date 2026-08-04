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

- [ ] Add later task-specific verification sections here as their briefs are introduced.
