---
"@wegooli/identity-react": patch
"@wegooli/identity-types": patch
"@wegooli/identity-ui": patch
---

Fix PKCE `code_challenge` hash input to match RFC 7636 §4.2.

`generatePKCEChallenge()` was hashing the raw 32 random bytes used to
produce the verifier; per the spec the hash must be over the *ASCII bytes
of the base64url-encoded verifier string* that actually travels on the
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
