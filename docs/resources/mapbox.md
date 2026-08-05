# Mapbox

Last verified: 2026-08-05

Create a Mapbox public token, restrict it to `http://localhost:3000/*` and production origins,
and store it as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. This value is intentionally browser-visible,
so never use a secret token. The web app imports Mapbox CSS once, sets `mapboxgl.accessToken`, and
cleans map instances up on unmount.

Verify map style and tile requests in browser developer tools. For 401/403 errors, check the token,
URL restrictions, billing/quota, CSP, and WebGL support. Rotate by deploying a replacement restricted
token before deleting the previous one.

Official reference: [Mapbox access tokens](https://docs.mapbox.com/help/getting-started/access-tokens/).
