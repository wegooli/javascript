---
"@wegooli/identity-ui": minor
"@wegooli/identity-react": minor
---

`<SignUp>` / `<SignIn>` 이 로그인·가입 표시(intent)를 직접 보낸다 — Google 시작 주소의 `intent=` 와 이메일·휴대폰 코드·로그인 링크 요청 본문.

지금까지는 소비자 앱이 `wg_auth_intent` 쿠키로 대신 알려야 했고, 앱과 통합 인증의 도메인이 다르면(예: `gw.hailor.ai` ↔ `api.idp.kr`) 쿠키가 넘어가지 않아 **Google 가입이 account_not_found 로 실패**했다. 이제 우회 코드(auth-intent)를 지워도 된다.

`useEmailOTP` · `usePhoneOTP` · `useMagicLink` 가 선택 인자 `{ intent }` 를 받는다 (안 넘기면 예전과 같다).
