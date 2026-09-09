/**
 * 위임에 관한 값들. Identity 가 돌려주는 JSON 을 그대로 옮긴 모양이다.
 */

/** 위임장 — "에이전트 A 가 주체 P 를 대신해 무엇까지, 언제까지" */
export interface Grant {
  id: string;
  organizationId: string;
  agentId: string;
  /** `user` = 우리 로그인 사용자, `external_user` = 고객사가 서명해서 알려준 사람, `organization` = 조직 */
  principalKind: 'user' | 'organization' | 'external_user';
  principalId: string;
  scope: string;
  allowedAudiences: string[];
  grantedVia: string;
  version: number;
  expiresAt: string;
  revokedAt?: string | null;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** 고객사 인증서버가 서명해서 알려준 사람. 우리 로그인 사용자가 아니다. */
export interface ExternalPrincipal {
  id: string;
  organizationId: string;
  issuerDid: string;
  subject: string;
  email?: string;
  displayName?: string;
  lastAssertedAt: string;
}

/** 위임장을 만들 때 진술로 밝혀진 사람 (진술을 보냈을 때만 온다) */
export interface AssertedPrincipal {
  id: string;
  kind: string;
  issuerDid: string;
  subject: string;
  email?: string;
  displayName?: string;
}

export interface EnsureGrantResult {
  grant: Grant;
  /** 처음 만들어졌으면 true, 이미 있던 것을 돌려받았으면 false */
  created: boolean;
  principal?: AssertedPrincipal;
}

/** 리소스 서버가 선언하는 권한 하나 */
export interface ResourceScope {
  name: string;
  /** 동의 화면에 그려질 문장. 1인칭 현재형으로 쓴다 — "내 문서를 읽습니다" */
  displayName: string;
  description?: string;
  /** 되돌리기 어려운 권한. 화면이 눈에 띄게 그린다 */
  isSensitive?: boolean;
}

export interface ResourceServer {
  id: string;
  organizationId: string;
  identifier: string;
  displayName: string;
  description?: string;
  metadataUrl?: string;
  isEnabled: boolean;
  scopes: ResourceScope[];
}

/** 위임 토큰이 밝혀 준 것 */
export interface AgentCaller {
  /** 이 요청의 결과에 책임지는 사람/조직 — 토큰의 `sub` */
  principalId: string;
  /** `user` / `organization` / `external_user`. 없을 수도 있다 */
  principalKind?: string;
  /** 실제로 요청을 보낸 에이전트 — 토큰의 `act.sub` */
  agentId: string;
  agentType?: string;
  /** 책임 주체의 이메일. 고객사 진술에서 왔든 우리 표에서 왔든 모양이 같다 */
  email?: string;
  organizationId?: string;
  /** 어느 위임장에서 나온 권한인가. 사고 뒤 "무엇이 허락돼 있었나" 의 근거 */
  grantId: string;
  grantVersion?: number;
  scopes: string[];
  /** 이 토큰이 향하도록 허락된 주소 */
  audience: string[];
  expiresAt: Date;
  /** 이 권한이 위임장에 있는가 */
  has(scope: string): boolean;
  /** 원본 클레임. 위의 것으로 부족할 때만 본다 */
  claims: Record<string, unknown>;
}
