# Dependency Catalog

Last verified: 2026-08-05

This catalog lists every direct dependency declared by the current workspace manifests. Update it in the same change that adds, removes, or upgrades a direct dependency.

| Dependency | Pinned version | Layer/owner | Purpose | Official docs | License | Credential/env |
| --- | --- | --- | --- | --- | --- | --- |
| Node.js | 24.18.1 | Monorepo runtime / platform | Runs pnpm, Next.js, and NestJS tooling locally | [Node.js](https://nodejs.org/en/docs) | MIT | None |
| pnpm | 11.0.0 | Monorepo package manager / platform | Installs and runs workspace packages | [pnpm](https://pnpm.io/) | MIT | None |
| Docker Compose | 5.3.1 | Local platform | Starts and stops local infrastructure | [Docker Compose](https://docs.docker.com/compose/) | Apache-2.0 | None |
| PostgreSQL | 16 | Data platform | Primary relational database | [PostgreSQL](https://www.postgresql.org/docs/) | PostgreSQL License | `DATABASE_URL` |
| PostGIS | 3.4 | Data platform | Spatial extension for PostgreSQL | [PostGIS](https://postgis.net/documentation/) | GPL-2.0-or-later | `DATABASE_URL` |
| `pg_trgm` | Bundled with PostgreSQL 16 | Data platform | Planned trigram indexing and fuzzy search extension | [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) | PostgreSQL License | `DATABASE_URL` |
| TypeScript | 5.7.3 / 5.9.3 | API and web | Static typing and compilation | [TypeScript](https://www.typescriptlang.org/docs/) | Apache-2.0 | None |
| `@nestjs/common` | 11.0.1 | API | NestJS application primitives | [NestJS](https://docs.nestjs.com/) | MIT | API environment variables |
| `@nestjs/config` | 4.0.4 | API | Environment loading and typed configuration access | [NestJS configuration](https://docs.nestjs.com/techniques/configuration) | MIT | API environment variables |
| `@nestjs/core` | 11.0.1 | API | NestJS runtime and dependency injection | [NestJS](https://docs.nestjs.com/) | MIT | API environment variables |
| `@nestjs/platform-express` | 11.0.1 | API | Express HTTP platform for NestJS | [NestJS](https://docs.nestjs.com/) | MIT | API environment variables |
| `class-transformer` | 0.5.1 | API | Transforms validated HTTP DTO input | [class-transformer](https://github.com/typestack/class-transformer) | MIT | None |
| `class-validator` | 0.14.3 | API | Validates HTTP DTO input through NestJS `ValidationPipe` | [class-validator](https://github.com/typestack/class-validator) | MIT | None |
| `reflect-metadata` | 0.2.2 | API | Decorator metadata runtime | [reflect-metadata](https://github.com/rbuckton/reflect-metadata) | Apache-2.0 | None |
| `rxjs` | 7.8.1 | API | Reactive primitives used by NestJS | [RxJS](https://rxjs.dev/) | Apache-2.0 | None |
| `dotenv` | 17.4.2 | API tooling | Loads local environment files for Drizzle commands | [dotenv](https://github.com/motdotla/dotenv) | BSD-2-Clause | `DATABASE_URL` |
| `drizzle-orm` | 0.45.2 | API infrastructure | Typed PostgreSQL query and transaction adapter | [Drizzle ORM](https://orm.drizzle.team/docs/overview) | Apache-2.0 | `DATABASE_URL` |
| `google-auth-library` | 11.0.0 | API authentication | Verifies Google Identity Services ID tokens in the NestJS API | [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs) | Apache-2.0 | `GOOGLE_CLIENT_ID` |
| `jose` | 6.2.8 | API authentication | Signs and verifies short-lived API session JWTs | [JOSE](https://github.com/panva/jose) | MIT | `SESSION_SECRET` |
| `pg` | 8.22.0 | API infrastructure | PostgreSQL connection pool and driver | [node-postgres](https://node-postgres.com/) | MIT | `DATABASE_URL` |
| `@eslint/eslintrc` | 3.2.0 | API tooling | Legacy ESLint configuration helpers | [ESLint](https://eslint.org/docs/latest/) | MIT | None |
| `@eslint/js` | 9.18.0 | API tooling | Base ESLint rule set | [ESLint](https://eslint.org/docs/latest/) | MIT | None |
| `@nestjs/cli` | 11.0.0 | API tooling | NestJS scaffold, build, and development commands | [Nest CLI](https://docs.nestjs.com/cli/overview) | MIT | None |
| `@nestjs/schematics` | 11.0.0 | API tooling | NestJS code-generation schematics | [Nest CLI](https://docs.nestjs.com/cli/overview) | MIT | None |
| `@types/express` | 5.0.0 | API tooling | Express TypeScript declarations | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | None |
| `@types/node` | 24.0.0 / 20.19.43 | API and web tooling | Node.js TypeScript declarations | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | None |
| `@types/pg` | 8.20.3 | API tooling | node-postgres TypeScript declarations | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | None |
| `drizzle-kit` | 0.31.10 | API tooling | Generates, checks, and inspects Drizzle migration history | [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview) | Apache-2.0 | `DATABASE_URL` |
| `eslint` | 9.18.0 / 9.39.5 | API and web tooling | JavaScript and TypeScript linting | [ESLint](https://eslint.org/docs/latest/) | MIT | None |
| `eslint-config-prettier` | 10.0.1 | API tooling | Disables formatting rules that conflict with Prettier | [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) | MIT | None |
| `eslint-config-next` | 16.2.12 | Web tooling | Next.js ESLint rules | [Next.js](https://nextjs.org/docs) | MIT | None |
| `eslint-plugin-prettier` | 5.2.2 | API tooling | Runs Prettier formatting checks through ESLint | [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) | MIT | None |
| `globals` | 17.0.0 | API tooling | Standard global-variable definitions for ESLint | [globals](https://github.com/sindresorhus/globals) | MIT | None |
| `prettier` | 3.4.2 | API tooling | Source formatting | [Prettier](https://prettier.io/docs/) | MIT | None |
| `source-map-support` | 0.5.21 | API tooling | Source-map stack traces | [source-map-support](https://github.com/evanw/node-source-map-support) | MIT | None |
| `ts-loader` | 9.5.2 | API tooling | TypeScript webpack loader | [ts-loader](https://github.com/TypeStrong/ts-loader) | MIT | None |
| `ts-node` | 10.9.2 | API tooling | TypeScript execution for development tooling | [ts-node](https://typestrong.org/ts-node/) | MIT | None |
| `tsx` | 4.23.5 | API tooling | Executes the TypeScript migration runner | [tsx](https://tsx.is/) | MIT | None |
| `tsconfig-paths` | 4.2.0 | API tooling | Resolves TypeScript path aliases at runtime | [tsconfig-paths](https://github.com/dividab/tsconfig-paths) | MIT | None |
| `typescript-eslint` | 8.20.0 | API tooling | TypeScript parser and rules for ESLint | [typescript-eslint](https://typescript-eslint.io/) | MIT | None |
| Next.js | 16.2.12 | Web | App Router frontend | [Next.js](https://nextjs.org/docs/app) | MIT | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WEB_ORIGIN`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| React | 19.2.4 | Web | Browser UI runtime | [React](https://react.dev/) | MIT | None |
| `react-dom` | 19.2.4 | Web | React DOM renderer | [React](https://react.dev/) | MIT | None |
| `mapbox-gl` | 3.27.0 | Web | Interactive browser map, markers, and camera controls | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) | BSD-3-Clause | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| `@tailwindcss/postcss` | 4.3.3 | Web tooling | Tailwind PostCSS integration | [Tailwind CSS](https://tailwindcss.com/docs) | MIT | None |
| `@types/react` | 19.2.18 | Web tooling | React TypeScript declarations | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | None |
| `@types/react-dom` | 19.2.4 | Web tooling | React DOM TypeScript declarations | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | None |
| `tailwindcss` | 4.3.3 | Web tooling | Utility CSS compiler | [Tailwind CSS](https://tailwindcss.com/docs) | MIT | None |
| Python | 3.12.x required | Ingestion runtime / platform | Runs the FastAPI ingestion worker and Python tooling | [Python](https://docs.python.org/3/) | PSF-2.0 | None |
| FastAPI | 0.116.1 | Ingestion | Worker-facing HTTP surface and ingestion orchestration | [FastAPI](https://fastapi.tiangolo.com/) | MIT | `INTERNAL_API_KEY`, `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_INGESTION_MODE`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| `uvicorn[standard]` | 0.35.0 | Ingestion | ASGI server for FastAPI | [Uvicorn](https://www.uvicorn.org/) | BSD-3-Clause | None |
| `httpx` | 0.28.1 | Ingestion | Timeout-bounded Internal API HTTP client | [HTTPX](https://www.python-httpx.org/) | BSD-3-Clause | `INTERNAL_API_KEY` |
| `pydantic` | 2.11.7 | Ingestion | Validates normalized ingestion candidates | [Pydantic](https://docs.pydantic.dev/) | MIT | None |
| `pydantic-settings` | 2.10.1 | Ingestion | Loads the worker-only environment contract | [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | MIT | `INTERNAL_API_KEY` |
| `google-genai` | 1.31.0 | Ingestion | Gemini JSON extraction adapter for bank documents | [Google Gen AI SDK](https://ai.google.dev/gemini-api/docs/libraries) | Apache-2.0 | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| `groq` | 0.31.0 | Ingestion | Groq JSON extraction fallback adapter | [Groq Python SDK](https://console.groq.com/docs/libraries) | Apache-2.0 | `GROQ_API_KEY`, `GROQ_MODEL` |
| OpenRouter API | HTTP via `httpx` | Ingestion | Final strict-JSON fallback for bank documents | [OpenRouter](https://openrouter.ai/docs/quickstart) | Provider terms | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Meta Graph API (Facebook Groups) | BLOCKED; Groups API removed April 22, 2024 | Ingestion / provider capability | No-network capability boundary; no group source is enabled without a new approved official-access ADR | [Graph API v19 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0/) | Meta Platform Terms | No credential accepted while blocked |
| `mypy` | 1.17.1 | Ingestion tooling | Static type checker | [mypy](https://mypy.readthedocs.io/) | MIT | None |
| `ruff` | 0.12.8 | Ingestion tooling | Linter and formatter | [Ruff](https://docs.astral.sh/ruff/) | MIT | None |
