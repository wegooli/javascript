import React from 'react';
import type { User, Organization } from '@wegooli/identity-types';
import { IdentityContext, IdentityContextValue } from '../context/IdentityContext';

export interface MockProviderProps {
  children: React.ReactNode;
  mockUser?: User;
  mockOrg?: Organization;
}

const DEFAULT_MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'dev@example.com',
  phoneNumber: '',
  username: '',
  identifier: 'dev@example.com',
  identifierType: 'email',
  displayName: 'Dev User',
  roles: ['member'],
  createdAt: new Date().toISOString(),
};

const DEFAULT_MOCK_ORG: Organization = {
  id: 'mock-org-id',
  slug: 'mock-org',
  displayName: 'Mock Organization',
  primaryColor: '#6366f1',
};

/**
 * MockProvider injects fake auth state for local development.
 * Activate by setting the MOCK_AUTH=true environment variable,
 * or by rendering this component directly in your dev tree.
 *
 * It satisfies the same IdentityContextValue interface as IdentityProvider.
 */
export function MockProvider({
  children,
  mockUser = DEFAULT_MOCK_USER,
  mockOrg = DEFAULT_MOCK_ORG,
}: MockProviderProps): React.ReactElement {
  const value: IdentityContextValue = {
    isLoaded: true,
    isSignedIn: true,
    userKind: 'tenant',
    userId: mockUser.id,
    user: mockUser,
    platformUser: null,
    organization: mockOrg,
    memberships: [],
    authPolicy: null,
    mfaPending: false,
    getToken: async () => 'mock-token',
    signOut: async () => {
      // no-op in mock mode
    },
  };

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

/** Convenience: auto-select MockProvider when MOCK_AUTH env var is set */
export function AutoProvider({
  children,
  mockUser,
  mockOrg,
  realProvider,
}: MockProviderProps & { realProvider: React.ReactElement }): React.ReactElement {
  const isMock =
    typeof globalThis !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)?.process?.env?.['MOCK_AUTH'] === 'true';

  if (isMock) {
    return (
      <MockProvider mockUser={mockUser} mockOrg={mockOrg}>
        {children}
      </MockProvider>
    );
  }

  return realProvider;
}
