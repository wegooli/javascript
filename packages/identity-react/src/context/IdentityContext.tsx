import React from 'react';
import type { User, PlatformUser, Organization, OrgAuthPolicy, Membership } from '@wegooli/identity-types';

export interface IdentityContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userKind: 'platform' | 'tenant' | null;
  userId: string | null;
  user: User | null;
  platformUser: PlatformUser | null;
  organization: Organization | null;
  memberships: Membership[];
  authPolicy: OrgAuthPolicy | null;
  /**
   * TRUE when primary auth succeeded but the user still owes the platform a
   * second factor. Until cleared, the BFF's session middleware blocks every
   * non-MFA endpoint with 403 mfa_required. Consumers should render the MFA
   * challenge UI from `<SignIn>` (or `<MFAChallenge>` directly) until this
   * flips back to false.
   */
  mfaPending: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const IdentityContext = React.createContext<IdentityContextValue | null>(null);

export function useIdentityContext(): IdentityContextValue {
  const ctx = React.useContext(IdentityContext);
  if (ctx === null) {
    throw new Error(
      'useAuth must be used within a IdentityProvider. ' +
        'Wrap your application with <IdentityProvider> to use authentication hooks.',
    );
  }
  return ctx;
}
