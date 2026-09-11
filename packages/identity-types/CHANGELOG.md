# @wegooli/identity-types

## 2.4.0

### Minor Changes

- c78dc8a: 이름이 이제 층을 가리킨다 — `workspace` · `instance` · `organization`.

  `organizationId` 는 한 이름으로 세 가지를 뜻해 왔습니다. 층이 하나뿐이던 때
  붙은 이름이고, 층이 셋이 된 뒤에도 밖으로 나가는 이름은 일부러 그대로 뒀습니다
  — 바꾸면 붙어 있는 모든 것이 한꺼번에 멎으니까요. 이번 릴리스는 **새 이름을
  같이 내보냅니다.** 옛 이름은 그대로 옵니다.

  ```
  workspace       개발사 계정 — 앱을 등록하고 팀을 두는 곳
  instance        제품 × 환경 — 개발 · 샌드박스 · 운영. 회원 풀의 경계
  organization    고객사 — 이 앱을 쓰는 회사. 이 이름은 여기 남습니다
  ```

  **바뀐 것.** `Workspace`(= `Organization` 의 새 이름)와 `CustomerOrganization`
  타입이 생겼습니다. `useAuth`·컨텍스트에 `workspace` 가 `organization` 과 나란히
  옵니다. `Membership` 에 `workspaceId`·`workspaceSlug`·`workspaceName` 이,
  `Grant`·`ExternalPrincipal` 에 `instanceId` 가 붙었습니다. 위임 토큰 검증
  결과(`DelegatedCaller`)에는 `instanceId` 와 **`customerOrganizationId`** 가
  생겼습니다.

  ⚠️ **`organizationId` 는 회사를 뜻하지 않습니다.** 위임 토큰에서 그 값은
  배포(`instanceId`)이고, 회사는 새로 생긴 `customerOrganizationId` 입니다.
  회사 단위로 무엇을 넓히고 있었다면 그쪽으로 옮기세요 — 옛 값으로 넓히면 한
  작업공간에 든 서로 다른 회사가 서로의 것을 보게 됩니다.

  **새 기능 하나.** `useCustomerOrganization()` — 이 사람이 속한 고객사 목록,
  지금 일하고 있는 회사, 그리고 바꾸는 함수. `organization` 이 `null` 인 것이
  정상입니다: 회사에 안 속했거나, 두 곳에 속했는데 아직 고르지 않았거나. 그걸
  "첫 번째 회사" 로 읽지 마세요 — 사람이 고르지 않은 회사 이름으로 계약이 나가는
  것은 화면 오류가 아닙니다.

  옛 이름은 **아직 지우지 않습니다.** 지우는 것은 붙어 있는 쪽이 전부 옮긴 뒤의
  메이저 릴리스입니다.

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
