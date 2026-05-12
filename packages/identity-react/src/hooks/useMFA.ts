import { useCallback, useState } from 'react';
import { bffClient } from '../api/bff-client';

export interface MFAFactor {
  id: string;
  userId: string;
  userKind: 'platform' | 'tenant';
  organizationId?: string;
  kind: 'totp' | 'passkey' | 'sms' | 'email_otp';
  label: string;
  isPrimary: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface UseMFAReturn {
  /** Caller-supplied state buckets so the same hook can drive both enroll + challenge UIs. */
  factors: MFAFactor[];
  isLoading: boolean;
  error: Error | null;

  /** GET /api/auth/mfa/factors — refreshes `factors`. */
  refresh: () => Promise<void>;

  /** Step 1 of TOTP enrollment. Returns enrollmentId + the otpauth:// URI for QR rendering. */
  beginTOTP: (label?: string) => Promise<{ enrollmentId: string; secret: string; otpauthUrl: string }>;
  /** Step 2 of TOTP enrollment. On success the session's MFA challenge is auto-completed. */
  confirmTOTP: (enrollmentId: string, code: string) => Promise<MFAFactor>;
  /** Used during the challenge step to lift mfa_pending=true on the current session. */
  verifyTOTP: (code: string) => Promise<void>;

  /** DELETE /api/auth/mfa/factors/:id */
  deleteFactor: (factorId: string) => Promise<void>;
}

/**
 * MFA hook. Two distinct flows share the same state bag:
 *
 *   - **Challenge** — primary auth done, `useAuth().mfaPending === true`.
 *     Caller presents `<MFAChallenge>` → `verifyTOTP(code)`.
 *   - **Enroll** — first time setting up, or a managed-profile screen.
 *     `beginTOTP() → confirmTOTP(enrollmentId, code)`.
 */
export function useMFA(): UseMFAReturn {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    return wrap(async () => {
      const r = await bffClient.get<{ factors: MFAFactor[] }>('/api/auth/mfa/factors');
      setFactors(r.factors ?? []);
    });
  }, [wrap]);

  const beginTOTP = useCallback(
    (label?: string) =>
      wrap(() =>
        bffClient.post<{ enrollmentId: string; secret: string; otpauthUrl: string }>(
          '/api/auth/mfa/totp/enroll/begin',
          { label },
        ),
      ),
    [wrap],
  );

  const confirmTOTP = useCallback(
    (enrollmentId: string, code: string) =>
      wrap(async () => {
        const r = await bffClient.post<{ factor: MFAFactor }>('/api/auth/mfa/totp/enroll/confirm', {
          enrollmentId,
          code,
        });
        return r.factor;
      }),
    [wrap],
  );

  const verifyTOTP = useCallback(
    (code: string) =>
      wrap(async () => {
        await bffClient.post('/api/auth/mfa/totp/verify', { code });
      }),
    [wrap],
  );

  const deleteFactor = useCallback(
    (factorId: string) =>
      wrap(async () => {
        await bffClient.delete(`/api/auth/mfa/factors/${factorId}`);
        setFactors((prev) => prev.filter((f) => f.id !== factorId));
      }),
    [wrap],
  );

  return { factors, isLoading, error, refresh, beginTOTP, confirmTOTP, verifyTOTP, deleteFactor };
}
