import type { TokenExchangeRequest, TokenExchangeResponse } from '@wegooli/identity-types';
import { bffClient, writeAccessToken } from './bff-client';
import { clearPKCEVerifier, readPKCEVerifier } from './pkce';

/**
 * Inspect `window.location.search` for a `?code=…` parameter left by the
 * BFF's OAuth callback. When found, exchange it against POST /api/auth/token
 * (using the verifier stashed at OAuth start), persist the returned bearer
 * token, and scrub `code` from the URL so a reload/refresh doesn't try again.
 *
 * Returns `true` when a callback was processed (the IdentityProvider can use
 * this signal to refresh `/api/auth/me` immediately rather than waiting for
 * the mount-time fetch). Returns `false` for normal page loads.
 *
 * Failure modes are swallowed silently — the caller's existing /api/auth/me
 * polling will report the user as anonymous and the SignIn component will
 * surface the issue on the next attempt. We never want a stray sessionStorage
 * verifier to throw past the consumer's app boundary.
 */
export async function handleOAuthCallback(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return false;

  const verifier = readPKCEVerifier();

  // Strip `?code=` regardless of what happens next so a reload doesn't loop.
  // history.replaceState keeps the rest of the user's path/hash intact.
  url.searchParams.delete('code');
  // Some IdPs also reflect a `state` param past the BFF (defensive cleanup).
  url.searchParams.delete('state');
  const cleaned = url.pathname + (url.search ? url.search : '') + url.hash;
  window.history.replaceState({}, '', cleaned);

  if (!verifier) {
    // No verifier means the SDK can't prove ownership of this code. Could
    // happen if the OAuth start ran in a different tab/origin. Clear and bail.
    return false;
  }

  try {
    const body: TokenExchangeRequest = { code, code_verifier: verifier };
    const resp = await bffClient.post<TokenExchangeResponse>('/api/auth/token', body);
    if (resp?.access_token) {
      writeAccessToken(resp.access_token);
    }
    return true;
  } catch {
    // bffClient throws on non-2xx; nothing actionable here. The user appears
    // unauthenticated to /api/auth/me; SignIn renders again.
    return false;
  } finally {
    clearPKCEVerifier();
  }
}
