import { useState, useCallback } from 'react';
import type { SignInRequest, SignInResponse } from '@wegooli/identity-types';
import { bffClient } from '../api/bff-client';

export interface UseSignInReturn {
  signIn: (method: SignInRequest['method'], params: Omit<SignInRequest, 'method'>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Provides a signIn function that posts to /api/auth/sign-in.
 * On success, reloads the page to hydrate the session from the new cookie.
 */
export function useSignIn(): UseSignInReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(
    async (method: SignInRequest['method'], params: Omit<SignInRequest, 'method'>): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await bffClient.post<SignInResponse>('/api/auth/sign-in', {
          method,
          ...params,
        });
        // Always follow the BFF-issued the upstream IdP auth URL.
        // params.redirectUrl is sent to the BFF for post-auth storage, not used here.
        const authUrl = response.redirectUrl;
        if (typeof window !== 'undefined' && authUrl) {
          window.location.href = authUrl;
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { signIn, isLoading, error };
}
