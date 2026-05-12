import { useState, useCallback } from 'react';
import type { SignUpRequest, SignUpResponse } from '@wegooli/identity-types';
import { bffClient } from '../api/bff-client';

export interface UseSignUpReturn {
  signUp: (params: SignUpRequest) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Provides a signUp function that posts to /api/auth/sign-up.
 * On success, reloads the page to hydrate the new session.
 */
export function useSignUp(): UseSignUpReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signUp = useCallback(async (params: SignUpRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bffClient.post<SignUpResponse>('/api/auth/sign-up', params);
      if (typeof window !== 'undefined') {
        window.location.href = response.redirectUrl ?? '/';
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { signUp, isLoading, error };
}
