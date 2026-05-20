---
"@wegooli/identity-types": patch
"@wegooli/identity-ui": patch
"@wegooli/identity-react": patch
---

Add optional `textColor` to AuthBranding and apply it on the SignIn card.

Mirrors the matching field that BFF now surfaces via `/api/auth/policy`
(identity#97). When the operator picks a text color in Dashboard's
Branding form, the SDK's SignIn card heading and body copy adopt it via
the `--brand-text` CSS variable (and a direct `color` inline style on the
card root so non-themed children pick it up too).

Backwards compatible: `textColor` is optional and the SDK falls back to
the existing neutral palette when unset.
