# @wegooli/identity-ui

## 1.0.5

### Patch Changes

- Updated dependencies [2868645]
  - @wegooli/identity-react@1.0.5

## 1.0.4

### Patch Changes

- b7fb5ae: Fix PKCE `code_challenge` hash input to match RFC 7636 §4.2.

  `generatePKCEChallenge()` was hashing the raw 32 random bytes used to
  produce the verifier; per the spec the hash must be over the _ASCII bytes
  of the base64url-encoded verifier string_ that actually travels on the
  wire. Spec-compliant servers (including our BFF) rejected every token
  exchange with `code_verifier mismatch`, so the entire OAuth-via-PKCE
  sign-in flow shipped in 1.0.3 was broken end-to-end.

  The fix is a one-line change inside `generatePKCEChallenge`:

  ```ts
  const verifierAscii = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', verifierAscii);
  ```

  Backwards compatible — same function signature, no API change. Consumers
  on 1.0.3 only need to bump.

- Updated dependencies [b7fb5ae]
  - @wegooli/identity-react@1.0.4
  - @wegooli/identity-types@1.0.4

## 1.0.3

### Patch Changes

- 1307cae: Add PKCE Authorization Code flow support for OAuth sign-in.

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

- Updated dependencies [1307cae]
  - @wegooli/identity-types@1.0.3
  - @wegooli/identity-react@1.0.3

## 1.0.2

### Patch Changes

- 30bb1ea: Expose `tailwind.preset.js` as a public subpath export so consumers can share the SDK's Tailwind theme tokens.

  Usage:

  ```js
  // tailwind.config.js
  module.exports = {
    presets: [require('@wegooli/identity-ui/tailwind.preset')],
    content: ['./src/**/*.{ts,tsx}', './node_modules/@wegooli/identity-ui/dist/**/*.{js,mjs}'],
  };
  ```

  The preset bundles the brand color scale, neutral grays, font stack, radius scale, and card shadows used by `@wegooli/identity-ui` primitives so the consuming app stays visually in sync.

## 1.0.1

### Patch Changes

- 24fc487: Verify the end-to-end automated publish flow after the NODE_AUTH_TOKEN fix in #8. No runtime change in any package.
- Updated dependencies [24fc487]
  - @wegooli/identity-types@1.0.1
  - @wegooli/identity-react@1.0.1

## 1.0.0

### Minor Changes

- 9f1c34f: **Breaking**: Renamed `ZitadelProvider` to `IdentityProvider`, `ZitadelContext` to `IdentityContext`, `ZitadelContextValue` to `IdentityContextValue`, and `useZitadelContext` to `useIdentityContext`.

  The SDK no longer exposes the upstream IdP implementation in its public API surface. The backend protocol (OIDC/OAuth2) is unchanged — only the identifier names are renamed.

  Migration:

  ```diff
  - import { ZitadelProvider, useZitadelContext } from '@wegooli/identity-react';
  + import { IdentityProvider, useIdentityContext } from '@wegooli/identity-react';

  - <ZitadelProvider bffBaseUrl="..." publishableKey="...">
  + <IdentityProvider bffBaseUrl="..." publishableKey="...">
      {children}
  - </ZitadelProvider>
  + </IdentityProvider>
  ```

  No alias is exported — this is an immediate rename.

### Patch Changes

- Updated dependencies [9f1c34f]
  - @wegooli/identity-types@1.0.0
  - @wegooli/identity-react@1.0.0

## 0.1.1

### Patch Changes

- 218a874: test CI release flow
