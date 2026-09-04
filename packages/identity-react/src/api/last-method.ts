/**
 * "Last used" sign-in method.
 *
 * Apps that offer several ways in (passkey, Google, email code…) leave people
 * guessing which one they picked last time — so they try the wrong one, or
 * create a second account by mistake. Remembering the last method and marking
 * it on the sign-in screen removes that guesswork.
 *
 * What is stored: the *method*, never the account. No email, no name, no id.
 * Where: `localStorage`, so it is per browser and per origin — one app's
 * choice never leaks into another's sign-in screen, which is what we want:
 * the same person may reasonably use Google on one product and a passkey on
 * another.
 *
 * Redirect flows need two steps. When the browser leaves for the OAuth
 * provider we only know the *intent*, not the outcome, so the intent is
 * stashed in `sessionStorage` and promoted to "last used" only after the
 * callback proves the sign-in worked (`handleOAuthCallback`). A cancelled
 * Google sign-in therefore leaves no mark.
 *
 * Every access is wrapped: private-mode browsers and embedded webviews throw
 * on storage access, and a sign-in screen must never break over a hint.
 */

const LAST_KEY = 'wg_last_method';
const PENDING_KEY = 'wg_pending_method';

/**
 * Method identifier. OAuth providers are namespaced so a provider named
 * "passkey" can never collide with the built-in passkey method.
 *
 *   'passkey' | 'email_otp' | 'phone_otp' | 'magic_link' | 'oauth:google'
 */
export type LastAuthMethod = string;

/** Namespaced id for an OAuth / custom provider button. */
export function oauthMethod(provider: string): LastAuthMethod {
  return `oauth:${provider}`;
}

function readStore(store: 'local' | 'session', key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    const v = s.getItem(key);
    return v && v.length <= 64 ? v : null;
  } catch {
    return null;
  }
}

function writeStore(store: 'local' | 'session', key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    s.setItem(key, value);
  } catch {
    /* private mode / storage disabled — the hint is optional, carry on */
  }
}

function removeStore(store: 'local' | 'session', key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    s.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** The method this browser signed in with last, or null if unknown. */
export function readLastMethod(): LastAuthMethod | null {
  return readStore('local', LAST_KEY);
}

/** Record a completed sign-in. Call only after the sign-in actually succeeded. */
export function rememberLastMethod(method: LastAuthMethod): void {
  if (!method) return;
  writeStore('local', LAST_KEY, method);
  removeStore('session', PENDING_KEY);
}

/**
 * Record an *attempt* that is about to leave the page (OAuth redirect, magic
 * link). Promoted to "last used" only when the return trip succeeds.
 */
export function stashPendingMethod(method: LastAuthMethod): void {
  if (!method) return;
  writeStore('session', PENDING_KEY, method);
}

/**
 * Turn a stashed attempt into the remembered method. Called from the OAuth
 * callback once the token exchange succeeded. No-op when nothing is pending.
 */
export function promotePendingMethod(): LastAuthMethod | null {
  const pending = readStore('session', PENDING_KEY);
  if (!pending) return null;
  rememberLastMethod(pending);
  return pending;
}

/** Forget the remembered method — e.g. a "not you?" affordance. */
export function clearLastMethod(): void {
  removeStore('local', LAST_KEY);
  removeStore('session', PENDING_KEY);
}
