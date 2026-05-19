// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeChallengeFromVerifier,
  generatePKCEChallenge,
  readPKCEVerifier,
  clearPKCEVerifier,
} from './pkce';

describe('PKCE — RFC 7636 conformance', () => {
  beforeEach(() => {
    clearPKCEVerifier();
  });

  it('matches the canonical SHA256(ASCII(verifier)) → base64url transformation', async () => {
    // RFC 7636 §4.2:
    //   code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
    //
    // Expected value cross-verified with an independent oracle:
    //   $ python3 -c "import hashlib,base64; print(base64.urlsafe_b64encode(\
    //       hashlib.sha256(b'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk').digest()\
    //     ).rstrip(b'=').decode())"
    //   E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    //
    // The whole point of pinning a fixed verifier→challenge pair is to catch
    // hash-input regressions like SDK 1.0.3 (raw bytes hashed instead of
    // ASCII) before they reach the BFF. Any future drift in the digest input,
    // base64url charset, or padding strategy fails here.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

    const actual = await computeChallengeFromVerifier(verifier);
    expect(actual).toBe(expectedChallenge);
  });

  it('round-trips: generated verifier hashes to the returned challenge', async () => {
    // Catches drift between the verifier we persist and the challenge we
    // hand off to the BFF — they must always represent the same value.
    const challenge = await generatePKCEChallenge();
    const verifier = readPKCEVerifier();
    expect(verifier).not.toBeNull();
    const recomputed = await computeChallengeFromVerifier(verifier!);
    expect(recomputed).toBe(challenge);
  });

  it('verifier matches the base64url charset', async () => {
    await generatePKCEChallenge();
    const verifier = readPKCEVerifier()!;
    // 32 random bytes → base64.RawURLEncoding → exactly 43 chars
    expect(verifier).toHaveLength(43);
    // Alphabet: A-Z a-z 0-9 - _   (no '+' '/' '=')
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('challenge matches the base64url charset', async () => {
    const challenge = await generatePKCEChallenge();
    // SHA-256 digest is 32 bytes → base64.RawURLEncoding → 43 chars
    expect(challenge).toHaveLength(43);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('each call generates a fresh verifier', async () => {
    await generatePKCEChallenge();
    const first = readPKCEVerifier();
    await generatePKCEChallenge();
    const second = readPKCEVerifier();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).not.toBe(second);
  });

  it('clearPKCEVerifier removes the stashed verifier', async () => {
    await generatePKCEChallenge();
    expect(readPKCEVerifier()).not.toBeNull();
    clearPKCEVerifier();
    expect(readPKCEVerifier()).toBeNull();
  });
});
