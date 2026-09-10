import React from 'react';
import type {
  User,
  PlatformUser,
  Organization,
  Workspace,
  CustomerOrganization,
  OrgAuthPolicy,
  Membership,
} from '@wegooli/identity-types';

export interface IdentityContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userKind: 'platform' | 'tenant' | null;
  userId: string | null;
  user: User | null;
  platformUser: PlatformUser | null;
  /** 이 앱을 만든 회사 — 개발사의 워크스페이스. */
  workspace: Workspace | null;
  /** @deprecated `workspace` 를 쓰세요. 같은 값입니다. */
  organization: Organization | null;
  memberships: Membership[];
  /**
   * 이 사람이 속한 **고객사** 목록. 앱 사용자에게만 채워진다.
   *
   * `workspace` 와 다른 층이다 — 그쪽은 이 앱을 만든 회사, 이쪽은 이 앱을
   * 쓰는 회사다.
   */
  organizations: CustomerOrganization[];
  /**
   * 지금 어느 고객사 일을 하고 있는가. **null 이 정상이다** — 회사에 안
   * 속했거나, 두 곳에 속했는데 아직 고르지 않았거나.
   */
  activeOrganization: CustomerOrganization | null;
  /**
   * 일하고 있는 고객사를 바꾼다. `null` 을 주면 "지금은 어느 회사 일도 아님".
   * 자기가 속하지 않은 회사를 주면 거절된다.
   */
  switchOrganization: (organizationId: string | null) => Promise<void>;
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
