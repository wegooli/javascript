import { useState, useCallback } from 'react';
import type { EmailOTPVerifyResponse } from '@wegooli/identity-types';
import { bffClient } from '../api/bff-client';

export interface UseEmailOTPReturn {
  /** Send a 6-digit code to the given email. */
  send: (email: string) => Promise<void>;
  /** Verify the code; on success the BFF sets the session cookie and we navigate. */
  verify: (email: string, code: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Email-OTP authentication hook for the dashboard's self-contained sign-in/sign-up
 * (no ZITADEL hosted UI involvement).
 *
 * On successful `verify`, the browser is navigated to the BFF-returned redirect URL
 * (typically `/dashboard`).
 */
export function useEmailOTP(): UseEmailOTPReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await bffClient.post('/api/auth/email-otp/send', { email });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await bffClient.post<EmailOTPVerifyResponse>('/api/auth/email-otp/verify', { email, code });
      if (typeof window !== 'undefined' && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { send, verify, isLoading, error };
}
