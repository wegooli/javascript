---
"@wegooli/identity-types": patch
"@wegooli/identity-react": patch
"@wegooli/identity-ui": patch
---

Add PKCE Authorization Code flow support for OAuth sign-in.

The SDK now generates a PKCE `code_challenge` (S256) when starting a social
OAuth flow and exchanges the resulting one-time `?code=` against
`POST /api/auth/token` on callback — keeping the bearer access token off the
URL fragment, browser history, and referrer headers (replaces the legacy
`#access_token=` surface, RFC 6749 §4.2.2 implicit, deprecated in OAuth 2.1).

- `@wegooli/identity-types`: new `TokenExchangeRequest` / `TokenExchangeResponse` / `TokenExchangeError`
- `@wegooli/identity-react`:
  - `generatePKCEChallenge()`, `readPKCEVerifier()`, `clearPKCEVerifier()`
  - `handleOAuthCallback()` — runs automatically on `IdentityProvider` mount
  - `readAccessToken()` / `writeAccessToken()` / `clearAccessToken()` exports
  - `bffClient` now attaches `Authorization: Bearer` automatically when a token is stored
  - `useAuth().getToken()` now returns the stored bearer (was always `null`)
- `@wegooli/identity-ui`: `SignIn` / `SignUp` attach `code_challenge` + `code_challenge_method=S256` to OAuth start

Backwards compatible — when Web Crypto is unavailable (very old browsers / non-secure contexts) the SDK falls back to the BFF's legacy fragment surface, and the BFF still supports it for clients pinned to ≤ 1.0.2.
