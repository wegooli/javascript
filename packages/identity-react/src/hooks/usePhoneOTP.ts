import { useCallback, useState } from 'react';
import { bffClient } from '../api/bff-client';

export interface UsePhoneOTPReturn {
  send: (phone: string) => Promise<void>;
  verify: (phone: string, code: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Phone-based OTP authentication. Tenant-only — the BFF endpoint requires a
 * publishable_key (org context). Uses the SMS provider configured at the
 * server (defaults to LogSMSSender in dev — codes appear in BFF stdout).
 */
export function usePhoneOTP(): UsePhoneOTPReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(async (phone: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await bffClient.post('/api/auth/phone-otp/send', { phone });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (phone: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await bffClient.post<{ status: string; redirectUrl?: string }>(
        '/api/auth/phone-otp/verify',
        { phone, code },
      );
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
