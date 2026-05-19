---
"@wegooli/identity-react": patch
---

Add RFC 7636 conformance tests for the PKCE challenge transformation.

Pins the SDK's `code_challenge` derivation against a known
verifier→challenge pair cross-verified with an independent oracle:

```
verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"   // BASE64URL(SHA256(ASCII(verifier)))
```

Any future drift in the digest input (the SDK 1.0.3 bug — raw bytes
hashed instead of ASCII), base64url charset, or padding strategy now
fails this test before it can reach the BFF.

Also exports a new helper, `computeChallengeFromVerifier(verifier)`, so
the same transformation is callable from tests without going through
the random-verifier-generation path. Backwards compatible — purely
additive.
