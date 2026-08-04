# MCC Resource Hub

Last verified: 2026-08-04

Start here when bringing up the monorepo on a new machine.

## Ordered Reading

1. [Local development](./local-development.md) for prerequisites, installation links, and first-run checkpoints.
2. [Application frameworks](./application-frameworks.md) for service boundaries, scaffold commands, and day-to-day commands.
3. [.env.example](../../.env.example) for the environment-variable contract. Keep secrets local and leave this file committed with empty secret values only.
4. [Manual verification](../manual-verification.md) for the repeatable smoke-test checklist.
5. [Dependency catalog](./dependency-catalog.md) for pinned versions, ownership, and credential mapping.

## Local Runtime Summary

- `docker compose up -d db` starts PostgreSQL 16 with PostGIS 3.4 on `localhost:5432`.
- `pnpm --filter api dev` starts the NestJS API on `http://localhost:3001`.
- `pnpm --filter web dev` starts the Next.js web app on `http://localhost:3000`.
- `python -m uvicorn app.main:app --reload --port 8000` is the planned FastAPI ingestion startup command once the service code lands in a later task.

## Secrets Contract

The environment variable names in [.env.example](../../.env.example) are the only committed secret contract for this repository. Keep every secret value empty in version control and define real values locally.
