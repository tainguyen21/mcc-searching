# Google Identity Services

Last verified: 2026-08-05

## Purpose

Google Identity Services signs a person in to the MCC web app. The browser obtains a Google ID token and sends it to `POST /auth/google`; NestJS verifies that token, upserts the local user, derives the local `user` or `admin` role, and writes a short-lived HTTP-only MCC session cookie. The browser never stores the Google ID token.

## Prerequisites

- A Google account that can create or select the project used for MCC.
- Access to the production web origin and the local web origin.
- `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `SESSION_SECRET`, and `ADMIN_EMAIL_ALLOWLIST` configured outside version control.
- The API migration applied, because sign-in persists local users in `app_user`.

## Create the Client ID

1. Open Google Cloud Console and create or select the MCC project.
2. Open Google Auth Platform and complete `Branding`, `Audience`, and `Data Access`.
3. Request only `openid`, `email`, and `profile`.
4. Create an OAuth client with application type `Web application`.
5. Add `http://localhost:3000` and each production web origin to Authorized JavaScript origins.
6. Copy the generated client ID to both variables:

   ```dotenv
   GOOGLE_CLIENT_ID=<GOOGLE_WEB_CLIENT_ID>
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<GOOGLE_WEB_CLIENT_ID>
   ```

7. Do not create or consume a client secret for this MVP's browser ID-token handoff.

## API Integration

1. Install the API packages:

   ```powershell
   pnpm --filter api add google-auth-library jose
   ```

2. Set a high-entropy value for `SESSION_SECRET` in the API secret manager. It signs the local MCC session and is unrelated to any Google credential.
3. Set `ADMIN_EMAIL_ALLOWLIST` as a comma-separated list of exact administrator emails:

   ```dotenv
   ADMIN_EMAIL_ALLOWLIST=admin@example.com,second-admin@example.com
   ```

4. Start the API:

   ```powershell
   pnpm --filter api dev
   ```

5. The web app sends the credential returned by Google Identity Services to:

   ```text
   POST /auth/google
   { "idToken": "<GOOGLE_ID_TOKEN>" }
   ```

6. NestJS verifies the token audience against `GOOGLE_CLIENT_ID`, writes the HTTP-only `mcc_session` cookie, and returns only the local user profile. `GET /auth/me` hydrates the web UI. `POST /auth/logout` removes the local cookie.

## Browser Integration

1. The Next.js Google control loads Google Identity Services only when
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured.
2. The returned credential is sent directly to `POST /auth/google`; it is never written to
   local storage, session storage, or a browser cookie.
3. The UI refreshes its local state from `GET /auth/me`, which contains only the MCC user ID,
   display name, and local role.
4. Local sign-out calls `POST /auth/logout` and clears the MCC API session. It does not attempt
   to manage the person’s separate Google browser session.

## Role and Access Rules

- Every authenticated Google identity gets the local `user` role unless its normalized email exactly matches `ADMIN_EMAIL_ALLOWLIST`.
- Every Admin API request checks the current JWT role and re-reads the local email against the current allowlist. Removing an email therefore blocks the next Admin request without waiting for session expiry.
- The local API does not return or persist Google access tokens, refresh tokens, or client secrets.

## Verification

1. Sign in with a non-allowlisted email and call `GET /auth/me`; expect the local `user` role.
2. Sign in with an allowlisted email and call an Admin endpoint added in a later task; expect access.
3. Remove that email from `ADMIN_EMAIL_ALLOWLIST` and repeat the Admin request; expect HTTP 403.
4. Inspect browser storage; no Google credential should appear in local storage or session storage.
5. Call `POST /auth/logout`, then `GET /auth/me`; expect HTTP 401.

## Troubleshooting

- `origin_mismatch`: add the exact web origin, including scheme and port, in the OAuth client configuration.
- Invalid audience: `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must be the same Web application client ID.
- Popup or third-party-cookie problems: verify the browser privacy settings and test a normal top-level navigation context.
- Token verification failure from clock skew: synchronize the API host clock before retrying.
- Missing local session cookie: check that the API is called with credentialed requests and that `secure` cookies are used only on HTTPS production origins.

## Least Privilege and Rotation

- Keep scopes limited to `openid`, `email`, and `profile`.
- Restrict authorized JavaScript origins to local development and the actual production web origins.
- To rotate or revoke access, create and deploy a replacement OAuth client ID, update both client-ID environment variables, then disable or delete the old client in Google Cloud Console.
- Rotate `SESSION_SECRET` through secret management. This invalidates existing local sessions, so deploy it during a planned sign-in refresh window.
- Remove an administrator by deleting the email from `ADMIN_EMAIL_ALLOWLIST`; the next Admin request is denied.

## Official References

- [Google Identity Services web client ID setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [Google ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)
