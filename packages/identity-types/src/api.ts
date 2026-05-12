import type { User, PlatformUser, Organization, Member, Membership, Role } from './auth';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

/**
 * /api/auth/me response.
 * - `userKind` discriminates the active session: 'platform' = dashboard, 'tenant' = end-user.
 * - `memberships` is populated only for `userKind === 'platform'` (multi-org switcher).
 *
 * No `token` field — sessions are HttpOnly-cookie based; browsers send the
 * cookie automatically. Server-to-server callers use Bearer sk_dev_xxx via the
 * admin API instead.
 */
export interface MeResponse {
  userKind: 'platform' | 'tenant' | null;
  user: User | null;
  platformUser: PlatformUser | null;
  organization: Organization | null;
  memberships?: Membership[];
  /** TRUE when primary auth succeeded but the user must still complete MFA. */
  mfaPending?: boolean;
}

export interface SignInRequest {
  method: 'passkey' | 'email_otp' | 'oauth';
  email?: string;
  otp?: string;
  provider?: string;
  redirectUrl?: string;
  /**
   * 'platform' = dashboard developer signup/sign-in (creates platform_user + workspace)
   * 'tenant'   = SDK end-user signup/sign-in (default)
   */
  flow?: 'platform' | 'tenant';
}

export interface SignInResponse {
  sessionId: string;
  user: User;
  organization: Organization;
  token: string;
  redirectUrl?: string;
}

export interface SignUpRequest {
  email: string;
  displayName: string;
  organizationSlug?: string;
  inviteToken?: string;
  /**
   * 'platform' = dashboard developer signup (creates platform_user + workspace)
   * 'tenant'   = SDK end-user signup (default)
   */
  flow?: 'platform' | 'tenant';
}

export interface SignUpResponse {
  sessionId: string;
  user: User;
  organization: Organization;
  token: string;
  redirectUrl?: string;
}

export interface OrganizationMembersResponse {
  members: Member[];
  total: number;
}

/**
 * Effective branding shown on the SDK's SignIn — app-level overrides layered
 * over org defaults. All fields may be empty (component falls back to neutral defaults).
 */
export interface AuthBranding {
  appName: string;
  logoUrl: string;
  primaryColor: string;
}

/** Phase B — which identifier kinds tenant users can sign in with. */
export type IdentifierKind = 'email' | 'phone' | 'username';

export interface OrgAuthPolicy {
  allowPasskey: boolean;
  allowEmailOtp: boolean;
  /** When true, the SignIn shows a "Email me a sign-in link" alternative. */
  allowMagicLink?: boolean;
  allowedOauthProviders: string[];
  /** Custom OIDC/OAuth providers configured per org (Track 3). */
  customProviders?: CustomProviderSummary[];
  /** Whether apps within this org share login sessions (Track 5). */
  ssoEnabled: boolean;
  /** Branding for the SignIn header — auto-applied by the SDK when present. */
  branding?: AuthBranding;
  /** Subset of {email, phone, username} the SignIn renders an input for. */
  allowedIdentifierKinds?: IdentifierKind[];
  /** Default tab/field shown when multiple kinds are allowed. */
  primaryIdentifierKind?: IdentifierKind;
}

export interface MagicLinkSendRequest {
  email: string;
  /** Where to redirect after the user clicks the link. Must be on the app's allowed_domains. */
  redirectUrl?: string;
}

export interface MagicLinkSendResponse {
  status: 'ok';
}

// ---------------------------------------------------------------------------
// Self-contained dashboard auth (no ZITADEL hosted UI)

export interface EmailOTPSendRequest {
  email: string;
}

export interface EmailOTPVerifyRequest {
  email: string;
  code: string;
}

export interface EmailOTPVerifyResponse {
  status: 'ok';
  redirectUrl: string;
}

// ---------------------------------------------------------------------------
// Org switching (Track 4)

export interface SwitchOrgRequest {
  organizationId: string;
}

export interface SwitchOrgResponse {
  sessionId: string;
  organization: Organization;
  memberships: Membership[];
}

// ---------------------------------------------------------------------------
// Invitations (Track 4)

export type InvitationRole = Exclude<Role, never>;

export interface SendInvitationRequest {
  email: string;
  role: InvitationRole;
}

export interface Invitation {
  id: string;
  organizationId: string;
  invitedEmail: string;
  role: InvitationRole;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface AcceptInvitationResponse {
  organization: Organization;
  role: InvitationRole;
}

// ---------------------------------------------------------------------------
// Custom providers (Track 3)

export type CustomProviderType = 'oidc' | 'oauth2';

/** Public summary returned in /api/auth/policy — no secrets. */
export interface CustomProviderSummary {
  key: string;
  name: string;
  iconUrl?: string;
}

/** Full provider detail for dashboard CRUD — secret never returned. */
export interface CustomProvider {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  providerType: CustomProviderType;
  clientId: string;
  issuerUrl?: string;
  scopes: string[];
  iconUrl?: string;
  configJson?: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderRequest {
  key: string;
  name: string;
  providerType: CustomProviderType;
  clientId: string;
  clientSecret: string; // write-only; never returned
  issuerUrl?: string;
  scopes?: string[];
  iconUrl?: string;
  configJson?: Record<string, unknown>;
}

export interface UpdateProviderRequest {
  name?: string;
  clientId?: string;
  /** Empty / undefined keeps the existing secret. */
  clientSecret?: string;
  issuerUrl?: string;
  scopes?: string[];
  iconUrl?: string;
  configJson?: Record<string, unknown>;
  isEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Application SSO mode (Track 5)

export type AppSsoMode = 'inherit' | 'enabled' | 'disabled';
