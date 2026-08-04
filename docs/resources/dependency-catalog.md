# Dependency Catalog

| Dependency | Pinned version | Layer/owner | Purpose | Official docs | License | Credential/env |
| --- | --- | --- | --- | --- | --- | --- |
| Node.js | 24.18.1 | Monorepo runtime / platform | Runs pnpm, Next.js, and NestJS tooling locally | [Node.js downloads](https://nodejs.org/en/download) | MIT | None |
| pnpm | 11.0.0 | Monorepo package manager / platform | Installs and runs workspace packages | [pnpm installation](https://pnpm.io/installation) | MIT | None |
| TypeScript | 5.9.3 (web), 5.7.3 (api) | Frontend and API teams | Static typing and compiler for the JavaScript services | [TypeScript docs](https://www.typescriptlang.org/docs/) | Apache-2.0 | None |
| Next.js | 16.2.12 | Web team | App Router frontend for the browser experience | [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) | MIT | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WEB_ORIGIN`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| NestJS | 11.0.1 | API team | HTTP API, auth boundary, and internal application orchestration | [NestJS first steps](https://docs.nestjs.com/first-steps) | MIT | `DATABASE_URL`, `INTERNAL_API_KEY`, `SESSION_SECRET`, `REVALIDATION_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAIL_ALLOWLIST` |
| Python | 3.12.x project prerequisite (Task 1 host currently has 3.14.6 only) | Ingestion runtime / platform | Runs the FastAPI ingestion worker and Python tooling | [Python on Windows](https://docs.python.org/3/using/windows.html) | PSF-2.0 | None |
| FastAPI | 0.116.1 | Ingestion team | Worker-facing HTTP surface and ingestion orchestration | [FastAPI first steps](https://fastapi.tiangolo.com/tutorial/first-steps/) | MIT | `INTERNAL_API_KEY`, `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_INGESTION_MODE`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Docker Compose | 5.3.1 | Local platform | Starts and stops the local infrastructure stack | [Docker Compose docs](https://docs.docker.com/compose/) | Apache-2.0 | None |
| PostgreSQL | 16 | Data platform | Primary relational database for the MVP | [PostgreSQL docs](https://www.postgresql.org/docs/) | PostgreSQL License | `DATABASE_URL` |
| PostGIS | 3.4 | Data platform | Spatial extension layer for PostgreSQL 16 | [PostGIS docs](https://postgis.net/documentation/) | GPL-2.0-or-later | `DATABASE_URL` |
| `pg_trgm` | Bundled with PostgreSQL 16 | Data platform | Trigram indexing and fuzzy-text search extension planned for later schema work | [pg_trgm docs](https://www.postgresql.org/docs/current/pgtrgm.html) | PostgreSQL License | `DATABASE_URL` |
