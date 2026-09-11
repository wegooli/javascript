import type { CustomerOrganization } from '@wegooli/identity-types';
import { useIdentityContext } from '../context/IdentityContext';

export interface UseCustomerOrganizationReturn {
  /** 이 사람이 속한 회사 전부. 회사에 안 속한 사람은 빈 배열이다. */
  organizations: CustomerOrganization[];
  /** 지금 어느 회사 일을 하고 있는가. null 이 정상이다 — 아래 설명 참고. */
  organization: CustomerOrganization | null;
  /** 회사를 바꾼다. `null` 이면 "지금은 어느 회사 일도 아님". */
  switchOrganization: (organizationId: string | null) => Promise<void>;
  isLoaded: boolean;
}

/**
 * 이 사람이 속한 **고객사**와, 지금 어느 회사 일을 하고 있는지.
 *
 * `useOrganization` 과 헷갈리기 쉬운 자리다. 그쪽은 이 앱을 **만든** 회사
 * (개발사의 워크스페이스)이고, 이쪽은 이 앱을 **쓰는** 회사다.
 *
 * ## null 이 정상이다
 *
 * `organization` 이 없는 경우가 둘이고 둘 다 정상이다.
 *
 *   회사에 안 속했다              — 대부분의 사람, 대부분의 앱
 *   두 곳에 속했는데 아직 안 골랐다 — 계약직·회계사·컨설팅에서 흔하다
 *
 * 뒤엣것을 "첫 번째 회사" 로 읽지 말 것. 사람이 고르지 않은 회사 이름으로
 * 계약이 나가는 것은 화면 오류가 아니다. 고르게 하고 싶으면 `organizations`
 * 로 목록을 그리고 `switchOrganization` 을 부르면 된다.
 *
 * @throws {Error} IdentityProvider 밖에서 부르면 던진다
 */
export function useCustomerOrganization(): UseCustomerOrganizationReturn {
  const ctx = useIdentityContext();
  return {
    organizations: ctx.organizations,
    organization: ctx.activeOrganization,
    switchOrganization: ctx.switchOrganization,
    isLoaded: ctx.isLoaded,
  };
}
