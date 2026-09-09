import { writeAccessToken } from './bff-client';

/**
 * Take the session the BFF handed back in the URL fragment
 * (`#access_token=…`) and persist it, then scrub it from the address bar.
 *
 * Every sign-in that finishes with a **browser redirect** delivers the session
 * this way: magic links, and social sign-in when the consumer did not start a
 * PKCE flow. Those redirects land on the consumer's own origin, which is
 * usually a different site from the BFF — so the session cookie cannot come
 * along (a response from `api.example.com` may not set a cookie for
 * `app.customer.com`, and browsers reject the attempt outright). The fragment
 * is the only carrier that survives the hop.
 *
 * Until this existed the SDK read `access_token` from response bodies only, so
 * a redirect-delivered session was dropped on the floor: sign-in had actually
 * succeeded server-side, yet the app rendered its signed-out state. People
 * clicked the magic link a second time and met "already used" on a link that
 * only ever works once.
 *
 * Runs synchronously so the token is in place before the first
 * `/api/auth/me`, and returns whether anything was found.
 *
 * The URL is only rewritten when a token was actually present — a hash-router
 * path like `#/settings` must survive untouched.
 */
export function consumeAccessTokenFragment(): boolean {
  if (typeof window === 'undefined') return false;

  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return false;

  const params = new URLSearchParams(raw);
  const token = params.get('access_token');
  if (!token) return false;

  writeAccessToken(token);

  // Leave any other fragment content alone; drop the '#' when nothing is left.
  params.delete('access_token');
  const rest = params.toString();
  const { pathname, search } = window.location;
  window.history.replaceState({}, '', `${pathname}${search}${rest ? `#${rest}` : ''}`);

  return true;
}
