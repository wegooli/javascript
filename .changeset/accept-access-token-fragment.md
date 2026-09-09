---
'@wegooli/identity-react': patch
---

Accept the session the BFF hands back in the URL fragment (`#access_token=…`).

Sign-ins that finish with a browser redirect — magic links, and social sign-in
without PKCE — land on the consumer's own origin, where the BFF's session
cookie cannot follow. The token rides along in the fragment, but the SDK only
ever read `access_token` out of response bodies, so it was dropped: sign-in had
succeeded server-side while the app still rendered its signed-out state. People
clicked the magic link again and met "already used" on a single-use link.

`IdentityProvider` now consumes the fragment on mount, before the first
`/api/auth/me`, and scrubs the token from the address bar. Hash-router paths
(`#/settings`) are left untouched.
