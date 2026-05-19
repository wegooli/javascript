import React, { useCallback, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User, PlatformUser, Organization, MeResponse, OrgAuthPolicy, Membership } from '@wegooli/identity-types';
import { IdentityContext, IdentityContextValue } from '../context/IdentityContext';
import { bffClient, clearAccessToken, configureBffClient, readAccessToken } from '../api/bff-client';
import { handleOAuthCallback } from '../api/oauth-callback';

export interface AppearanceConfig {
  primaryColor?: string;
  logoUrl?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface IdentityProviderProps {
  children: React.ReactNode;
  /** BFF base URL. Defaults to '' (same origin). */
  bffBaseUrl?: string;
  /** Organization identifier / publishable key */
  publishableKey: string;
  /** Optional theme customization */
  appearance?: AppearanceConfig;
}

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function IdentityProviderInner({
  children,
  bffBaseUrl = '',
  publishableKey,
}: IdentityProviderProps): React.ReactElement {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userKind, setUserKind] = useState<'platform' | 'tenant' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [authPolicy, setAuthPolicy] = useState<OrgAuthPolicy | null>(null);
  const [mfaPending, setMfaPending] = useState(false);

  useEffect(() => {
    configureBffClient(bffBaseUrl, publishableKey);

    // Single fetch + state writer. Reused on mount, on tab focus, and on the
    // background interval so a force-logout from the dashboard takes effect
    // without a full page reload.
    let cancelled = false;

    const refreshMe = (markLoaded: boolean) => {
      bffClient
        .get<MeResponse>('/api/auth/me')
        .then((data) => {
          if (cancelled) return;
          setUserKind(data.userKind);
          setUser(data.user);
          setPlatformUser(data.platformUser);
          setOrganization(data.organization);
          setMemberships(data.memberships ?? []);
          setMfaPending(Boolean(data.mfaPending));
          setIsSignedIn(data.user !== null || data.platformUser !== null);
        })
        .catch(() => {
          if (cancelled) return;
          setIsSignedIn(false);
          setUserKind(null);
          setUser(null);
          setPlatformUser(null);
          setOrganization(null);
          setMemberships([]);
          setMfaPending(false);
        })
        .finally(() => {
          if (!cancelled && markLoaded) setIsLoaded(true);
        });
    };

    // PKCE callback redemption — when a `?code=` is present on the URL,
    // exchange it for a bearer token before the first /api/auth/me fetch
    // so the request is authenticated on the first try (avoids a flash of
    // signed-out UI). Resolves to false on plain page loads.
    handleOAuthCallback().finally(() => {
      if (!cancelled) refreshMe(true);
    });

    bffClient
      .get<OrgAuthPolicy>(`/api/auth/policy?publishableKey=${encodeURIComponent(publishableKey)}`)
      .then((p) => {
        if (!cancelled) setAuthPolicy(p);
      })
      .catch(() => null);

    // Re-check on tab focus: catches "I just got force-logged-out from another
    // tab/dashboard" without polling continuously.
    const onFocus = () => refreshMe(false);
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshMe(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
    }

    // Belt-and-suspenders 60s interval. Cheap (a single GET against the BFF
    // BFF is hot in the same datacenter) and bounds the worst-case window in
    // which a revoked session continues to look "signed in" client-side.
    const interval = setInterval(() => refreshMe(false), 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [bffBaseUrl, publishableKey]);

  // Same-site consumers sign in via HttpOnly cookie and getToken stays null.
  // Cross-site SDK consumers receive a bearer token through the PKCE callback
  // and getToken surfaces it (e.g. for caller's own fetch interceptor).
  const getToken = useCallback(async (): Promise<string | null> => readAccessToken(), []);

  const signOut = useCallback(async (): Promise<void> => {
    await bffClient.post('/api/auth/sign-out', {});
    clearAccessToken();
    setIsSignedIn(false);
    setUserKind(null);
    setUser(null);
    setPlatformUser(null);
    setOrganization(null);
    setMemberships([]);
    setMfaPending(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
  }, []);

  const value: IdentityContextValue = {
    isLoaded,
    isSignedIn,
    userKind,
    userId: user?.id ?? platformUser?.id ?? null,
    user,
    platformUser,
    organization,
    memberships,
    authPolicy,
    mfaPending,
    getToken,
    signOut,
  };

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function IdentityProvider(props: IdentityProviderProps): React.ReactElement {
  return (
    <QueryClientProvider client={defaultQueryClient}>
      <IdentityProviderInner {...props} />
    </QueryClientProvider>
  );
}
