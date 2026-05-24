---
"@wegooli/identity-types": patch
"@wegooli/identity-react": patch
---

Persist `access_token` returned by tenant-flow auth verify endpoints.

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
