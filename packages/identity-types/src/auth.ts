/**
 * End-user (tenant) account — created via the SDK's SignIn/SignUp.
 * Scoped to one organization (the application's tenant org).
 *
 * Identifier may be email/phone/username (Phase A flexible identifiers).
 * `identifier` + `identifierType` are convenience fields for UI rendering —
 * they hold the primary value (email > phone > username preference).
 */
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  username: string;
  identifier: string;
  identifierType: 'email' | 'phone' | 'username' | '';
  displayName: string;
  roles: string[];
  createdAt: string;
}

/**
 * Dashboard developer account — created via dashboard signup.
 * Email is globally unique. Can belong to multiple organizations via Membership[].
 */
export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  lastActiveOrganizationId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  slug: string;
  displayName: string;
  logoUrl?: string;
  primaryColor?: string;
}

/**
 * A platform-user's membership in one organization, with a role.
 * Returned via /api/auth/me for OrganizationSwitcher rendering.
 */
export interface Membership {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  role: Role;
}

export type Role = 'owner' | 'admin' | 'member';

export interface Member {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  joinedAt: string;
}

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: User | null;
  organization: Organization | null;
}
