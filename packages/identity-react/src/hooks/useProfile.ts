import { useCallback, useState } from 'react';
import { bffClient } from '../api/bff-client';

export interface ProfileIdentifiers {
  email: string;
  phoneNumber: string;
  username: string;
  displayName: string;
}

export type ProfileIdentifierKind = 'email' | 'phone' | 'username';

export interface UseProfileReturn {
  profile: ProfileIdentifiers | null;
  isLoading: boolean;
  error: Error | null;

  refresh: () => Promise<void>;

  /** Email change — sends OTP to the new address, then confirm with the code. */
  startEmailChange: (newEmail: string) => Promise<void>;
  confirmEmailChange: (newEmail: string, code: string) => Promise<void>;

  /** Phone change — sends SMS OTP, then confirm. */
  startPhoneChange: (newPhone: string) => Promise<void>;
  confirmPhoneChange: (newPhone: string, code: string) => Promise<void>;

  /** Username and displayName don't need verification. */
  setUsername: (username: string) => Promise<void>;
  setDisplayName: (displayName: string) => Promise<void>;

  /** Remove an identifier. Server refuses to remove the user's last one. */
  removeIdentifier: (kind: ProfileIdentifierKind) => Promise<void>;
}

/**
 * Profile management hook. Tenant-only — platform users (dashboard developers)
 * have a separate management surface (and only an email column today).
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileIdentifiers | null>(null);
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

  const refresh = useCallback(
    () =>
      wrap(async () => {
        const r = await bffClient.get<ProfileIdentifiers>('/api/auth/profile');
        setProfile(r);
      }),
    [wrap],
  );

  const startEmailChange = useCallback(
    (email: string) => wrap(() => bffClient.post('/api/auth/profile/email/start', { email }).then(() => undefined)),
    [wrap],
  );

  const confirmEmailChange = useCallback(
    (email: string, code: string) =>
      wrap(async () => {
        await bffClient.post('/api/auth/profile/email/confirm', { email, code });
        await refresh();
      }),
    [wrap, refresh],
  );

  const startPhoneChange = useCallback(
    (phone: string) => wrap(() => bffClient.post('/api/auth/profile/phone/start', { phone }).then(() => undefined)),
    [wrap],
  );

  const confirmPhoneChange = useCallback(
    (phone: string, code: string) =>
      wrap(async () => {
        await bffClient.post('/api/auth/profile/phone/confirm', { phone, code });
        await refresh();
      }),
    [wrap, refresh],
  );

  const setUsername = useCallback(
    (username: string) =>
      wrap(async () => {
        await bffClient.put('/api/auth/profile/username', { username });
        await refresh();
      }),
    [wrap, refresh],
  );

  const setDisplayName = useCallback(
    (displayName: string) =>
      wrap(async () => {
        await bffClient.put('/api/auth/profile/display-name', { displayName });
        await refresh();
      }),
    [wrap, refresh],
  );

  const removeIdentifier = useCallback(
    (kind: ProfileIdentifierKind) =>
      wrap(async () => {
        await bffClient.delete(`/api/auth/profile/identifier/${kind}`);
        await refresh();
      }),
    [wrap, refresh],
  );

  return {
    profile,
    isLoading,
    error,
    refresh,
    startEmailChange,
    confirmEmailChange,
    startPhoneChange,
    confirmPhoneChange,
    setUsername,
    setDisplayName,
    removeIdentifier,
  };
}
