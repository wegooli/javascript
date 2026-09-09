---
'@wegooli/identity-types': minor
'@wegooli/identity-react': minor
'@wegooli/identity-ui': minor
---

Sign-in, sign-up and the two-factor step now speak Korean by default, and the
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
