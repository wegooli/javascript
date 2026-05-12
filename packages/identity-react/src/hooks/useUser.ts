import type { User } from '@wegooli/identity-types';
import { useIdentityContext } from '../context/IdentityContext';

export interface UseUserReturn {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * Returns the current user object and load state.
 *
 * @throws {Error} if used outside of a IdentityProvider
 */
export function useUser(): UseUserReturn {
  const ctx = useIdentityContext();

  return {
    user: ctx.user,
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
  };
}
