# MCC Operations Runbook

Last verified: 2026-08-05

## Local Stack

Start the database with `docker compose up -d db`, apply `pnpm --filter api db:migrate`,
then run the API, web, and ingestion services. The Compose `app` profile starts all three
application services after the database health check.

## Backup and Restore

```powershell
docker compose exec -T db pg_dump -U mcc -d mcc -Fc > mcc-backup.dump
docker compose exec -T db createdb -U mcc mcc_restore
Get-Content mcc-backup.dump -AsByteStream | docker compose exec -T db pg_restore -U mcc -d mcc_restore --clean --if-exists
```

For a failed production migration, restore the latest validated backup or deploy a new
forward-fix migration. Never edit or delete an applied Drizzle migration.

## Rotation and Recovery

- `INTERNAL_API_KEY`: create a replacement secret, deploy worker and API together, validate one
  authenticated Internal API request, then revoke the old value.
- `SESSION_SECRET`: rotate in secret management and expect all API sessions to require sign-in.
- `REVALIDATION_SECRET`: update API and web deployment settings together, then call a store
  revalidation request and check the next store response.
- Google client IDs: deploy the replacement `GOOGLE_CLIENT_ID` and
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, validate configured origins, then disable the old client.
- LLM and supported-provider keys: deploy a replacement, execute a redacted schema check, then
  revoke the previous key. Logs must never include values.

## Source Incidents

Disable a source with `PATCH /admin/sources/:sourceId` and `{"enabled":false}` as an allowlisted
Admin. The next normalized item returns the stable ignored result. Failed provider jobs are
isolated; restart the worker only after correcting the source configuration or secret.

Facebook remains disabled by ADR 0001. Do not attempt recovery or token rotation for the blocked
Facebook path.

## ISR Recovery

If a store page remains stale, verify the API is returning updated approved data, check the
revalidation secret/configuration, retry the authenticated revalidation route once, and use the
bounded page revalidation interval as the fallback.
