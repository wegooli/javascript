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

/**
 * 개발사의 계정 — 우리 고객이 앱을 등록하고 팀을 두는 곳.
 *
 * 이 타입의 이름이 `Organization` 인 것은 층이 하나뿐이던 때 붙은 것이다.
 * 지금은 층이 셋이고, 이 타입이 가리키는 것은 그중 **워크스페이스**다.
 * `Workspace` 가 같은 모양의 새 이름이고, 그쪽을 쓰면 된다.
 */
export interface Organization {
  id: string;
  slug: string;
  displayName: string;
  logoUrl?: string;
  primaryColor?: string;
}

/** `Organization` 의 새 이름. 모양은 같다. */
export type Workspace = Organization;

/**
 * 고객사 — 앱 사용자들이 속한 회사. **고객의 고객**이다.
 *
 * 위의 `Organization`(= 워크스페이스)과 헷갈리기 쉬운 자리다. 층으로 보면
 * 워크스페이스 → 앱 → 환경 → **고객사** 순으로 아래에 있다.
 */
export interface CustomerOrganization {
  id: string;
  slug: string;
  displayName: string;
  logoUrl?: string;
  /** 이 회사에 속한 사람 수. 목록 화면용. */
  memberCount?: number;
}

/**
 * A platform-user's membership in one organization, with a role.
 * Returned via /api/auth/me for OrganizationSwitcher rendering.
 */
export interface Membership {
  /** 소속된 워크스페이스. */
  workspaceId?: string;
  workspaceSlug?: string;
  workspaceName?: string;
  /** @deprecated `workspaceId` 를 쓰세요. 같은 값입니다. */
  organizationId: string;
  /** @deprecated `workspaceSlug` 를 쓰세요. */
  organizationSlug: string;
  /** @deprecated `workspaceName` 를 쓰세요. */
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
  /** 이 사람이 속한 워크스페이스. */
  workspace: Workspace | null;
  /** @deprecated `workspace` 를 쓰세요. 같은 값입니다. */
  organization: Organization | null;
}
