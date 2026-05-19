/**
 * RFC 7636 PKCE helpers — used when initiating an OAuth flow against the BFF.
 *
 * Browser-only: relies on the Web Crypto API (`crypto.subtle.digest`,
 * `crypto.getRandomValues`). All modern browsers ship these in secure
 * contexts (HTTPS or localhost). On server-side render the functions throw —
 * callers must guard with `typeof window !== 'undefined'`.
 */

const VERIFIER_STORAGE_KEY = 'wg_pkce_verifier';

/** Encode a Uint8Array as base64url (RFC 4648 §5, no padding). */
function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ensureBrowser(): void {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('PKCE requires the Web Crypto API (browser secure context).');
  }
}

/**
 * Generate a fresh PKCE verifier and stash it in sessionStorage under
 * VERIFIER_STORAGE_KEY. Returns the matching S256 challenge — the caller
 * appends this to the OAuth start URL as `code_challenge=…`.
 *
 * The verifier never leaves the browser. sessionStorage scope is
 * per-tab/origin, which fits the OAuth round-trip (same tab, same origin).
 */
export async function generatePKCEChallenge(): Promise<string> {
  ensureBrowser();
  const verifierBytes = new Uint8Array(32);
  window.crypto.getRandomValues(verifierBytes);
  const verifier = base64UrlEncode(verifierBytes);
  const digest = await window.crypto.subtle.digest('SHA-256', verifierBytes);
  const challenge = base64UrlEncode(new Uint8Array(digest));
  window.sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  return challenge;
}

/** Read the verifier stashed by generatePKCEChallenge(), or null if absent. */
export function readPKCEVerifier(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(VERIFIER_STORAGE_KEY);
}

/** Clear the verifier — call after a successful token exchange. */
export function clearPKCEVerifier(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
}
