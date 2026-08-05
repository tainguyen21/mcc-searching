# MCC Resource Hub

Last verified: 2026-08-05

Start here when bringing up the monorepo on a new machine.

## Ordered Reading

1. [Local development](./local-development.md) for prerequisites, installation links, and first-run checkpoints.
2. [Application frameworks](./application-frameworks.md) for service boundaries, scaffold commands, and day-to-day commands.
3. [Database and Drizzle](./database-and-drizzle.md) to start PostGIS and apply inspected migrations.
4. [Google Identity Services](./google-oauth.md) to create the web client ID and configure API sessions.
5. [Mapbox](./mapbox.md) to configure the restricted browser map token.
6. [LLM providers](./llm-providers.md) to configure the bank-policy fallback chain.
7. [Facebook capability gate](./facebook-graph-api.md) to keep the unsupported integration disabled.
8. [.env.example](../../.env.example) for the environment-variable contract. Keep secrets local and leave this file committed with empty secret values only.
9. [Manual verification](../manual-verification.md) for the repeatable smoke-test checklist.
10. [Dependency catalog](./dependency-catalog.md) for pinned versions, ownership, and credential mapping.

## Local Runtime Summary

- `docker compose up -d db` starts PostgreSQL 16 with PostGIS 3.4 on `localhost:5432`.
- `pnpm --filter api dev` starts the NestJS API on `http://localhost:3001`.
- `pnpm --filter web dev` starts the Next.js web app on `http://localhost:3000`.
- `python -m uvicorn app.main:app --app-dir services/ingestion --port 8000` starts the FastAPI worker.

## Secrets Contract

The environment variable names in [.env.example](../../.env.example) are the only committed secret contract for this repository. Keep every secret value empty in version control and define real values locally.
