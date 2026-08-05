# ADR 0001: Block Facebook Group Ingestion

- Status: BLOCKED
- Date: 2026-08-05
- Owners: MCC ingestion maintainers

## Context

Meta's Graph API v19 changelog states that the Facebook Groups API was removed from
all Graph API versions on April 22, 2024. On 2026-08-05, the project reviewed that
official changelog and the current Meta developer product, permissions, and App Review
documentation. The project owner has not supplied credentials or evidence of a current
official capability that grants this project authorized access to target group posts and
comments.

Official baseline:

- [Graph API v19 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0/)
- [Meta App Review](https://developers.facebook.com/docs/app-review/)
- [Meta access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)

## Required Evidence

The decision can change only when all of the following are recorded in a new ADR and
reviewed before implementation:

1. A current official Meta product or API name and version.
2. Official endpoints for authorized group posts and comments.
3. The exact permissions or features required, including any App Review result.
4. Proof that the app and project owner are authorized to access every target group.
5. The token type, expiry, renewal or rotation path, and least-privilege scope.
6. A successful owner-provided test request with IDs and content redacted.

None of these evidence items has been supplied for this project as of 2026-08-05.

## Decision

Facebook group ingestion is BLOCKED. Facebook sources remain disabled. The ingestion
worker exposes `unsupported_provider_capability` with `capability: "blocked"` and
`scheduling: "skipped"`; it creates no Facebook jobs, attempts no Meta network request,
and accepts no token.

The project must not scrape Facebook HTML, automate a browser, process images, collect
profiles, use a token-acquisition bypass, or document an unsupported workaround.

## Consequences

The social-ingestion completion criterion remains incomplete. A compliant replacement,
such as an operator-provided export/import flow, requires a user-approved specification
amendment before design or implementation.
