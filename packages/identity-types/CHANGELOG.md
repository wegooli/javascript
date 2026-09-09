# @wegooli/identity-types

## 2.3.0

### Minor Changes

- 22a3cb5: Sign-in, sign-up and the two-factor step now speak Korean by default, and the
  copy can be changed without forking the components.

  These screens are the only thing an app's own users ever see of this SDK, and
  every word on them was English — `Continue with Passkey`, `Email address`,
  `Email me a sign-in link instead`. There was also no way for an integrator to
  change any of it: `SignInProps` took no copy, and `appearance` only reaches
  colours, the logo and class names.

  **Language.** `<SignIn />`, `<SignUp />` and `<MFAChallenge />` take a `locale`
  (`'ko' | 'en'`) and a `labels` object that overrides individual strings. When
  neither is given they fall back to the app's `branding.locale` from
  `/api/auth/policy` — a field this release adds to `AuthBranding` so the setting
  can eventually live in the dashboard — and finally to Korean. Existing apps get
  Korean by shipping this version; pass `locale="en"` to keep English.

  **Errors.** The red banner used to print the transport's own message, so a
  mistyped phone number read `BFF request failed (400): {"error":"invalid_phone"}`.
  Failures now carry a code (`IdentityError`, exported from `@wegooli/identity-react`)
  and the banner renders a sentence in the chosen language that says what to do
  next; the code stays available as `data-error-code` for debugging. Passkey
  cancellation is covered too — closing the fingerprint prompt rejects with a
  browser-authored `DOMException` that the previous code never recognised.

  **Header.** `<SignIn />` used the screen title as a stand-in app name when an
  app had no branding, which rendered the same word three times. It now draws the
  name row only when there is a name or logo, matching what `<SignUp />` already did.

## 1.0.7

### Patch Changes

- fa04fa6: Persist `access_token` returned by tenant-flow auth verify endpoints.

  Previously only the PKCE callback (`/api/auth/token`) called `writeAccessToken`
  with the BFF response. OTP and Passkey verify hooks read `redirectUrl` from the
  response but ignored `access_token`, leaving `localStorage['wg_access_token']`
  empty after sign-in. As a result, SDK consumers using `Authorization: Bearer`
  to call their own backend received 401 even though the BFF session cookie was
  set.

  This change makes `useEmailOTP.verify`, `usePhoneOTP.verify`, and
  `usePasskey.signInWithPasskey` call `writeAccessToken(res.access_token)` when
  the BFF includes it (tenant flow, i.e. publishable_key was attached). Platform
  (dashboard) flow continues to rely on the HttpOnly cookie alone, unaffected.

  Also exposes `access_token?: string` on `EmailOTPVerifyResponse` for type
  parity with the BFF response (matches `addAccessTokenIfSDK` in identity#bff).

## 1.0.6

### Patch Changes

- 964e210: Add optional `textColor` to AuthBranding and apply it on the SignIn card.

  Mirrors the matching field that BFF now surfaces via `/api/auth/policy`
  (identity#97). When the operator picks a text color in Dashboard's
  Branding form, the SDK's SignIn card heading and body copy adopt it via
  the `--brand-text` CSS variable (and a direct `color` inline style on the
  card root so non-themed children pick it up too).

  Backwards compatible: `textColor` is optional and the SDK falls back to
  the existing neutral palette when unset.

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

## 1.0.1

### Patch Changes

- 24fc487: Verify the end-to-end automated publish flow after the NODE_AUTH_TOKEN fix in #8. No runtime change in any package.

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
