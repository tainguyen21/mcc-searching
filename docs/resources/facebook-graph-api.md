# Facebook Graph API Capability Gate

Last verified: 2026-08-05

## Status

Facebook group ingestion is **BLOCKED** for this project. Meta's Graph API v19 changelog
records removal of the Facebook Groups API from all Graph API versions on April 22, 2024.
The project has no owner-provided credentials or official evidence of a currently supported
replacement for authorized group post and comment access.

This is a capability decision, not a transient service outage. Do not attempt setup with a
new Meta app, Graph API Explorer, a token, a scraper, browser automation, or an unofficial
permission path.

## Prerequisites and Account Setup

There is no supported account, app, product, App Review, permission, or key-acquisition
procedure to perform for this blocked integration. Leave the Facebook source disabled.

The committed environment contract intentionally remains:

```text
FACEBOOK_INGESTION_MODE=disabled
FACEBOOK_ACCESS_TOKEN=
```

Do not populate `FACEBOOK_ACCESS_TOKEN` while this ADR is `BLOCKED`. The current worker
does not read or transmit the token.

## Current Integration Behavior

The worker has a no-network Facebook adapter. It always reports:

```json
{
  "status": "unsupported_provider_capability",
  "capability": "blocked",
  "scheduling": "skipped",
  "jobCreated": false
}
```

Start the worker from `services/ingestion` with Python 3.12:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m uvicorn app.main:app --reload --port 8000
```

Verify the stable unavailable state:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/facebook/capability
```

No Facebook work is scheduled, no job is created, and no request is made to Meta.

## Required Decision Before Re-enabling

Do not change `FACEBOOK_INGESTION_MODE` or implement a provider adapter unless a new
approved ADR records all of these items:

1. A current official Meta product/API and version.
2. Official group-post and comment endpoints.
3. Required permissions/features and App Review approval.
4. Target-group authorization for the app and project owner.
5. Token type, expiry, rotation, and least-privilege scope.
6. A successful owner-provided test request with IDs and content redacted.

If Meta cannot provide this capability, submit a specification amendment for a compliant
alternative such as an operator-provided export/import flow. Do not implement that
alternative without approval.

## Troubleshooting

- `unsupported_provider_capability` is the expected result, not an error to retry.
- A configured Facebook token does not change the blocked result and should be removed.
- Do not create a failed ingestion job for this condition; scheduling remains skipped.
- Do not log a token, group ID, post text, comment text, profile data, or image data.

## Least Privilege, Rotation, and Revocation

No Facebook credential is authorized for this blocked path. Keep the access-token value
empty. If a token was entered locally, remove it from the environment or secret manager and
revoke it through Meta before any future capability review. A future approved integration
must document the exact minimum permissions, expiry, rotation, revocation, and audit path.

## Official References

- [Graph API v19 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0/)
- [Meta App Review](https://developers.facebook.com/docs/app-review/)
- [Meta access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)
