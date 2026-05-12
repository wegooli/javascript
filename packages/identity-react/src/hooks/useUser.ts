import type { User } from '@wegooli/identity-types';
import { useZitadelContext } from '../context/ZitadelContext';

export interface UseUserReturn {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * Returns the current user object and load state.
 *
 * @throws {Error} if used outside of a ZitadelProvider
 */
export function useUser(): UseUserReturn {
  const ctx = useZitadelContext();

  return {
    user: ctx.user,
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
  };
}
