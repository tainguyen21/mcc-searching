# Database and Drizzle

Last verified: 2026-08-04

The NestJS API is the only service that connects directly to PostgreSQL. It uses `node-postgres` for pooling, Drizzle ORM for typed queries, and Drizzle Kit for migration history. The Python ingestion worker calls the protected Internal API and never receives `DATABASE_URL`.

## Official References

- [Drizzle with node-postgres](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [PostGIS documentation](https://postgis.net/documentation/)

## Local Database

1. Start Docker Desktop and wait until its Linux engine is running.
2. From the repository root, run:

```powershell
docker compose up -d db
docker compose exec db pg_isready -U mcc -d mcc
```

3. Copy `.env.example` to a local `.env` file and retain the local `DATABASE_URL` value unless the database host or port differs.
4. Keep `.env` untracked. Production supplies `DATABASE_URL` through its deployment secret manager.

## Drizzle Workflow

The TypeScript schema lives in `apps/api/src/infrastructure/database/schema/`. Drizzle Kit writes generated and custom SQL migration files plus its journal metadata under `apps/api/drizzle/`.

```powershell
pnpm --filter api db:generate -- --name=mcc_core
pnpm --filter api exec drizzle-kit generate --custom --name=extensions --config drizzle.config.ts
pnpm --filter api exec drizzle-kit generate --custom --name=spatial_search --config drizzle.config.ts
pnpm --filter api db:check
pnpm --filter api db:migrate
```

Before applying a migration, inspect the generated SQL file and confirm it matches the intended change. Do not use `drizzle-kit push` in a shared or production environment.

## Extensions and Checks

The first custom migration creates the extensions required by the MVP:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

After migrations apply, verify them with:

```sql
SELECT PostGIS_Version();
SELECT extversion FROM pg_extension WHERE extname = 'pg_trgm';
```

## Troubleshooting

- `Cannot connect to Docker engine`: start Docker Desktop and confirm `docker info` returns a server version.
- `DATABASE_URL is required`: create a local `.env` file from `.env.example`, then rerun the Drizzle command from `apps/api` through `pnpm --filter api`.
- `extension "postgis" is not available`: use the PostGIS Compose image from `docker-compose.yml`; a plain PostgreSQL image does not include it.
- `drizzle-kit check` reports migration history drift: do not edit an applied migration. Create a forward-fix migration or restore the database before retrying.
- Failed production migration: stop deployment, restore from the latest verified backup if needed, then ship a forward-fix migration. Never delete or rewrite migration history.
