import { IdentityError, IdentityErrorCodes } from './errors';

let _baseUrl = '';
let _publishableKey = '';

/**
 * 세션이 끊겼을 때 보낼 경로. 소비자 앱마다 로그인 화면 경로가 다르므로
 * IdentityProvider 가 설정한다. null 이면 SDK 가 이동시키지 않고, 401 을
 * 예외로만 알린다 (소비자가 직접 처리).
 */
let _signInUrl: string | null = '/sign-in';

const ACCESS_TOKEN_STORAGE_KEY = 'wg_access_token';

/** Configure the BFF base URL. Called by IdentityProvider on mount. */
export function configureBffClient(
  baseUrl: string,
  publishableKey?: string,
  signInUrl?: string | null,
): void {
  _baseUrl = baseUrl.replace(/\/$/, '');
  if (publishableKey !== undefined) {
    _publishableKey = publishableKey;
  }
  if (signInUrl !== undefined) {
    _signInUrl = signInUrl;
  }
}

/** The configured sign-in path, or null when navigation is disabled. */
export function readSignInUrl(): string | null {
  return _signInUrl;
}

/**
 * Read the bearer token persisted by the PKCE callback handler. Returns null
 * during SSR or when the user signs in via cookie-only (same-site) flow.
 */
export function readAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

/** Persist the bearer token after a successful PKCE token exchange. */
export function writeAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

/** Remove the bearer token — called on sign-out / 401. */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

function getBaseUrl(): string {
  return _baseUrl;
}

/**
 * Returns the configured BFF base URL — exported so SDK components can build
 * full URLs for browser-level navigation (e.g. social-OAuth start endpoints
 * that require a full-page redirect, not fetch()).
 */
export function readBffBaseUrl(): string {
  return _baseUrl;
}

/** Returns the publishable key configured on the IdentityProvider, if any. */
export function readPublishableKey(): string {
  return _publishableKey;
}

function authHeaders(): Record<string, string> {
  // The BFF resolves an AppContext from this header so endpoints can scope
  // tenant-side operations (sign-up, sign-in, etc.) to the right organization.
  //
  // Authorization: Bearer is added when the PKCE callback handler stashed a
  // token — cross-site SDK consumers whose SameSite=Lax cookie is blocked
  // depend on it. Same-site consumers keep using the HttpOnly cookie sent
  // via `credentials: include`; the Bearer header is additive, not exclusive.
  const headers: Record<string, string> = {};
  if (_publishableKey) headers['X-Platform-Publishable-Key'] = _publishableKey;
  const token = readAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Clear the (now-stale) bearer token alongside the cookie redirect — the
    // BFF will issue a fresh one when the user signs in again.
    clearAccessToken();
    if (typeof window !== 'undefined' && _signInUrl) {
      window.location.href = _signInUrl;
    }
    throw new IdentityError('Unauthorized: session expired', {
      code: IdentityErrorCodes.sessionExpired,
      status: 401,
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const body = parseErrorBody(text);
    // message 는 종전 형식 그대로 둔다 — 로그에서 이 문자열을 보던 곳이 있다.
    // 사람에게 보여 줄 문장은 code 를 보고 identity-ui 가 만든다.
    throw new IdentityError(`BFF request failed (${res.status}): ${text}`, {
      code: body.code,
      status: res.status,
      details: body.details,
      retryAfter: body.retryAfter ?? retryAfterHeader(res),
    });
  }
  return res.json() as Promise<T>;
}

/**
 * BFF 는 오류를 `{"error":"invalid_phone","details":"…"}` 로 준다. 본문이
 * JSON 이 아닐 수도 있으므로(프록시가 낸 HTML 오류 페이지 등) 실패는 조용히
 * 넘긴다 — 그러면 코드 없는 오류가 되고, 화면은 일반 안내 문장을 쓴다.
 */
function parseErrorBody(text: string): { code?: string; details?: string; retryAfter?: number } {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    return {
      code: typeof j.error === 'string' ? j.error : undefined,
      details: typeof j.details === 'string' ? j.details : undefined,
      retryAfter: typeof j.retryAfter === 'number' ? j.retryAfter : undefined,
    };
  } catch {
    return {};
  }
}

function retryAfterHeader(res: Response): number | undefined {
  const raw = res.headers?.get?.('Retry-After');
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

export const bffClient = {
  get: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      credentials: 'include',
      headers: { ...authHeaders() },
    });
    return handleResponse<T>(res);
  },

  post: async <T = unknown>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  put: async <T = unknown>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  delete: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { ...authHeaders() },
    });
    return handleResponse<T>(res);
  },
};
