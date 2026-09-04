# @wegooli/identity-ui

## 3.0.0

### Minor Changes

- badf4e6: 로그인 화면에 "지난번에 쓴 방법" 표시

  로그인 방법이 여러 개면 사람들은 매번 "지난번에 뭘로 들어왔더라"를 떠올려야 한다.
  틀리면 다른 방법으로 들어가 계정이 하나 더 생기기도 한다. 마지막으로 성공한 방법을
  기억해 두고 그 버튼에만 `Last used` 표시를 붙인다.
  - 저장하는 것은 **방법 이름뿐**이다. 이메일·이름·식별자는 저장하지 않는다.
  - `localStorage` 라 브라우저·도메인마다 따로다. 앱 A 에서 구글로 들어갔다고 앱 B 에
    그 표시가 뜨지 않는다.
  - 소셜 로그인처럼 **페이지를 떠났다 돌아오는 방법**은 성공이 확인된 뒤에만 기록한다.
    구글 화면에서 취소하고 돌아오면 아무 표시도 남지 않는다.
  - 사생활 보호 모드처럼 저장소를 못 쓰는 환경에서는 조용히 표시만 생략한다.

  identity-react 에 `readLastMethod` · `rememberLastMethod` · `clearLastMethod` 등을
  내보내므로, SDK UI 를 쓰지 않고 직접 화면을 그리는 앱도 같은 규칙을 쓸 수 있다.

### Patch Changes

- Updated dependencies [badf4e6]
  - @wegooli/identity-react@3.0.0

## 2.0.1

### Patch Changes

- c422326: bare 모드에서도 대시보드 브랜딩(색)을 적용한다

  `<SignIn bare>` · `<SignUp bare>` 는 카드 껍데기를 렌더하지 않는 모드인데,
  브랜드 색 변수(`--brand-primary`)를 심는 자리가 하필 그 껍데기였다. 그래서 자체
  카드 디자인을 쓰려고 bare 를 켠 앱에서는, 대시보드에서 색을 바꿔도 SDK 버튼이
  기본색 그대로였다(소비자 앱마다 같은 보정 코드를 따로 넣고 있었다).

  bare 는 "껍데기 없이"라는 뜻이지 "브랜딩 없이"가 아니다. 이제 bare 모드에서도
  변수를 내려보낸다. 소비자 레이아웃을 건드리지 않도록 `display: contents` 로
  감싸고, 브랜딩이 없는 앱에서는 아무것도 감싸지 않는다(기존 동작 그대로).

## 2.0.0

### Minor Changes

- 21a5031: 소비자 앱에서 조용히 깨지던 세 가지를 고쳤다. 세 가지 모두 오류를 내지 않아,
  붙이는 쪽에서 원인을 찾는 데 시간이 걸리던 것들이다.

  **React 19 를 설치할 수 없었다**

  `peerDependencies` 가 `react ^18` 로 고정돼 있어 React 19 앱에서 설치가 실패했다
  (`--legacy-peer-deps` 로 우회해야 했다). `^18 || ^19` 로 넓혔다.

  **로그아웃이 `/sign-in` 으로 고정돼 있었다**

  세션이 끝나면 SDK 가 `window.location.href = '/sign-in'` 으로 페이지를 날렸다.
  경로가 코드에 박혀 있어, 로그인 화면이 다른 경로인 앱은 로그아웃이 404 로
  떨어졌다. 게다가 강제 이동이 앱의 뒷정리(자체 세션 쿠키 삭제 등)를 끊어서,
  로그아웃했는데 다시 들어가면 로그인 상태로 보이는 일이 있었다.

  `IdentityProvider` 에 `signInUrl` 을 추가했다. 기본값은 종전과 같은 `/sign-in`
  이고, `null` 을 주면 SDK 가 이동시키지 않는다.

  **스타일이 붙지 않았다**

  CSS 를 동봉하지 않고 소비자 앱의 Tailwind 가 클래스를 생성해 주기를 기대했다.
  그래서 소비자가 `content` 에 이 패키지를 넣지 않았거나, 프리셋을 적용하지
  않았거나, 간격 스케일을 다르게 정의해 뒀으면 화면이 조용히 깨졌다. 실제로
  버튼이 흰 바탕에 흰 글씨가 되어 보이지 않고, 카드 여백이 두 배가 되는 사례가
  있었다.

  `dist/styles.css` 를 함께 배포한다.

  ```ts
  import '@wegooli/identity-ui/styles.css';
  ```

  모든 규칙이 컴포넌트 자체 래퍼(`.wg-identity`) 후손으로 한정돼 있어 소비자
  마크업에 새지 않고, 후손 선택자라 명시도가 높아 소비자가 스케일을 바꿔 뒀어도
  의도한 모습으로 그려진다. 종전 방식(프리셋 + content)도 계속 동작한다.

### Patch Changes

- Updated dependencies [21a5031]
  - @wegooli/identity-react@2.0.0

## 1.0.7

### Patch Changes

- Updated dependencies [fa04fa6]
  - @wegooli/identity-types@1.0.7
  - @wegooli/identity-react@1.0.7

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

- Updated dependencies [964e210]
  - @wegooli/identity-types@1.0.6
  - @wegooli/identity-react@1.0.6

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
