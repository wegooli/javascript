import { useIdentityContext } from '../context/IdentityContext';

export interface UseAuthReturn {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  orgId: string | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

/**
 * Returns the current authentication state.
 *
 * @throws {Error} if used outside of a IdentityProvider
 */
export function useAuth(): UseAuthReturn {
  const ctx = useIdentityContext();

  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    orgId: ctx.organization?.id ?? null,
    getToken: ctx.getToken,
    signOut: ctx.signOut,
  };
}
