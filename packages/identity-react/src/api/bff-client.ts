let _baseUrl = '';
let _publishableKey = '';

/** Configure the BFF base URL. Called by ZitadelProvider on mount. */
export function configureBffClient(baseUrl: string, publishableKey?: string): void {
  _baseUrl = baseUrl.replace(/\/$/, '');
  if (publishableKey !== undefined) {
    _publishableKey = publishableKey;
  }
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

/** Returns the publishable key configured on the ZitadelProvider, if any. */
export function readPublishableKey(): string {
  return _publishableKey;
}

function authHeaders(): Record<string, string> {
  // The BFF resolves an AppContext from this header so endpoints can scope
  // tenant-side operations (sign-up, sign-in, etc.) to the right organization.
  return _publishableKey ? { 'X-Platform-Publishable-Key': _publishableKey } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Unauthorized: session expired');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`BFF request failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
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
