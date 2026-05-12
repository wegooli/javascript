import { useState, useCallback } from 'react';
import { bffClient } from '../api/bff-client';

export interface UseMagicLinkReturn {
  /**
   * Send a one-time sign-in link to the given email. After delivery the BFF
   * will create a session and redirect to `redirectUrl` (defaults to current
   * page) when the user clicks through.
   */
  send: (email: string, redirectUrl?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  /** Set after a successful send so callers can render a "check your inbox" state. */
  sentTo: string | null;
  reset: () => void;
}

/**
 * Magic-link authentication hook. Tenant-flow only — the BFF endpoint requires
 * a publishable_key (the link's organization scope is derived from it).
 *
 * Unlike useEmailOTP, the user never types a code: they click the link in
 * their inbox and the BFF redirects them back into the app already
 * authenticated. The verify step happens on the server, so the SDK never
 * sees the token.
 */
export function useMagicLink(): UseMagicLinkReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = useCallback(async (email: string, redirectUrl?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Default redirect to the current page so the user lands where they left
      // off after clicking the email link.
      const dest =
        redirectUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined);
      await bffClient.post('/api/auth/magic-link/send', {
        email,
        ...(dest ? { redirectUrl: dest } : {}),
      });
      setSentTo(email);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSentTo(null);
    setError(null);
  }, []);

  return { send, isLoading, error, sentTo, reset };
}
