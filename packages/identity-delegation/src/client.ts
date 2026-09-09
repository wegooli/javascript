import { DelegationError } from './errors';
import type {
  EnsureGrantResult,
  ExternalPrincipal,
  Grant,
  ResourceScope,
  ResourceServer,
} from './types';

export interface DelegationClientOptions {
  /** Identity 주소. 예: `https://api.freezz.kr` */
  baseUrl: string;
  /** `sk_live_…` 비밀 키. **브라우저에 절대 넣지 않는다** */
  secretKey: string;
  /** 테스트나 프록시용. 기본은 전역 fetch */
  fetch?: typeof globalThis.fetch;
  /** 한 요청의 제한 시간(ms). 기본 10초 */
  timeoutMs?: number;
}

export interface EnsureGrantOptions {
  agentId: string;
  /**
   * 우리 로그인을 쓰는 사람의 id. 자체 인증 고객이라면 이 대신
   * `principalAssertion` 을 보낸다. **둘 중 정확히 하나**만 보낸다.
   */
  principalId?: string;
  /**
   * 고객사 인증서버가 서명한 진술. "지금 이 버튼을 누른 사람은 우리 직원
   * 아무개다" 를 서명한 문서다. 만드는 법은 통합 문서를 참고한다.
   */
  principalAssertion?: string;
  /** 공백으로 구분한 권한 이름. 리소스 서버가 선언한 것만 쓸 수 있다 */
  scope: string;
  /** 이 위임으로 받은 토큰이 향할 수 있는 서비스 주소 */
  audience: string | string[];
  /** 며칠 뒤 만료할지. 외부 주체는 최대 1일 */
  expiresInDays?: number;
  /** 절대 시각으로 주고 싶을 때 (RFC 3339) */
  expiresAt?: string;
  /** 화면에서 사람이 본 문구·시각 등. 그대로 보관된다 */
  consentEvidence?: Record<string, unknown>;
  /**
   * 껐던 사람이 **화면에서 다시 동의를 눌렀을 때만** true 로 보낸다.
   * 재시도 로직이 자동으로 붙이면 안 된다 — 그 순간 끄기가 의미를 잃는다.
   */
  reconsent?: boolean;
  /** RFC 9396 — 금액 한도 같은, 권한 이름으로 표현 못 하는 제한 */
  authorizationDetails?: unknown;
}

export interface IssueTokenOptions {
  grantId: string;
  audience: string;
  /** 위임장의 권한 중 일부만 원할 때. 비우면 위임장 전체 */
  scope?: string;
  /**
   * 에이전트 자신의 머신 자격증명(ZITADEL 이 발급한 JWT). Identity 는 이 값으로
   * "이 위임장이 정말 이 에이전트 것인가" 를 확인한다.
   */
  machineToken: string;
  /** 키에 묶인 에이전트라면 DPoP 증명 */
  dpopProof?: string;
}

export interface IssuedToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Identity 의 서버 간 API 를 감싼다.
 *
 * ── 왜 "끄기" 가 "켜기" 와 같은 자리에 있는가 ──────────────────────────────
 *
 * 이 라이브러리가 존재하는 이유의 절반은 `revoke` 다. 토큰 검사만 제공하고
 * 위임 만들기를 각자 짜게 두면, 고객마다 다르게 짜게 되고 그중 몇은 반드시
 * **끄는 자리가 빠진 채로** 나온다. 스페이스노트에서 실제로 그렇게 됐다 —
 * "언제든 끌 수 있습니다" 라고 화면에 적어 두고, 끄는 버튼이 없었다.
 *
 * 그래서 `ensure` 와 `revoke` 는 같은 객체에 있고, 인자 수도 비슷하다.
 * 켜는 코드를 쓴 사람이 끄는 코드를 못 찾는 일이 없게 하려는 것이다.
 */
export class DelegationClient {
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(options: DelegationClientOptions) {
    // 비밀 키가 브라우저 번들에 들어가는 것은 이 라이브러리가 만들 수 있는
    // 가장 큰 사고다. 그 키 하나로 이 조직의 모든 위임을 만들고 지울 수 있다.
    // 실수는 대개 "서버용 모듈을 클라이언트 컴포넌트에서 import" 한 것이고,
    // 그 순간 소리가 나야 한다.
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      throw new Error(
        '@wegooli/identity-delegation 은 서버에서만 씁니다. ' +
          'sk_ 비밀 키가 브라우저로 나가면 이 조직의 모든 위임을 누구나 만들고 지울 수 있습니다.',
      );
    }
    if (!options.baseUrl) throw new Error('baseUrl 이 필요합니다');
    if (!options.secretKey?.startsWith('sk_')) {
      throw new Error('secretKey 는 sk_ 로 시작하는 비밀 키여야 합니다 (pk_ 는 공개 키입니다)');
    }
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.secretKey = options.secretKey;
    this.doFetch = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  // ── 위임 ────────────────────────────────────────────────────────────────

  readonly grants = {
    /**
     * 사람이 스위치를 켰을 때 부른다. **같은 (에이전트, 사람) 조합으로 여러 번
     * 불러도 위임장이 하나만 생긴다** — 사람은 스위치를 두 번 누르고, 위임장이
     * 둘이면 끌 때 하나만 꺼서는 안 멈춘다.
     *
     * 외부 주체(자체 인증 고객의 직원)라면 **이 호출이 갱신도 겸한다.** 새
     * 진술을 붙여 다시 부르면 만료일이 밀린다. 진술을 못 만들게 되면(퇴사)
     * 아무도 아무것도 안 해도 위임장이 스스로 닫힌다.
     */
    // `async` 인 것이 중요하다. 인자 검사를 동기로 던지면
    // `ensure(...).catch(handle)` 로 쓴 코드가 그 오류만 못 받는다 — 같은 함수가
    // 어떤 실패는 던지고 어떤 실패는 거절하는 API 는 반드시 한쪽을 놓치게 한다.
    ensure: async (options: EnsureGrantOptions): Promise<EnsureGrantResult> => {
      const hasId = Boolean(options.principalId);
      const hasAssertion = Boolean(options.principalAssertion);
      if (hasId === hasAssertion) {
        throw new Error(
          'principalId (우리 로그인 사용자) 또는 principalAssertion (고객사가 서명한 진술) 중 정확히 하나가 필요합니다',
        );
      }
      return this.request<EnsureGrantResult>('POST', '/v1/agent-grants', {
        agentId: options.agentId,
        principalId: options.principalId,
        principalAssertion: options.principalAssertion,
        scope: options.scope,
        allowedAudiences: Array.isArray(options.audience) ? options.audience : [options.audience],
        expiresInDays: options.expiresInDays,
        expiresAt: options.expiresAt,
        consentEvidence: options.consentEvidence,
        reconsent: options.reconsent,
        authorizationDetails: options.authorizationDetails,
      });
    },

    /** 이 에이전트가 들고 있는 위임장들. 끄기 화면이 그리는 목록이다. */
    list: async (options: { agentId: string }): Promise<Grant[]> => {
      const out = await this.request<{ grants: Grant[] }>(
        'GET',
        `/v1/agent-grants?agentId=${encodeURIComponent(options.agentId)}`,
      );
      return out.grants ?? [];
    },

    /**
     * 끈다. **다음 검증 시점에 바로** 먹는다 — 이미 나가 있는 토큰도 무효가 된다.
     *
     * 이유를 적어 두면 나중에 "왜 멈췄나" 에 답할 수 있다. 사람이 껐는지,
     * 관리자가 껐는지, 사고 대응이었는지가 전부 다른 이야기다.
     */
    revoke: (grantId: string, reason?: string): Promise<void> =>
      this.request<void>('POST', `/v1/agent-grants/${encodeURIComponent(grantId)}/revoke`, {
        reason,
      }),
  };

  // ── 외부 주체 ────────────────────────────────────────────────────────────

  readonly externalPrincipals = {
    /** 진술로 알게 된 사람들. 우리 로그인 사용자가 아니다. */
    list: async (): Promise<ExternalPrincipal[]> => {
      const out = await this.request<{ externalPrincipals: ExternalPrincipal[] }>(
        'GET',
        '/v1/external-principals',
      );
      return out.externalPrincipals ?? [];
    },
  };

  // ── 내 서비스의 권한 어휘 ────────────────────────────────────────────────

  readonly resourceServers = {
    /**
     * 내 서비스가 받는 권한 이름과 그 뜻을 선언한다. 동의 화면이 이 문장을
     * 그대로 그린다.
     *
     * 배포할 때마다 불러도 된다 — 주소가 같으면 행이 하나로 유지되고, 선언은
     * 통째로 바뀐다. 권한 하나를 목록에서 빼면 그 권한은 더 이상 위임될 수 없다.
     */
    declare: async (options: {
      identifier: string;
      displayName: string;
      description?: string;
      metadataUrl?: string;
      scopes: ResourceScope[];
    }): Promise<ResourceServer> => {
      const out = await this.request<{ resourceServer: ResourceServer }>(
        'PUT',
        '/v1/resource-servers',
        options,
      );
      return out.resourceServer;
    },

    list: async (): Promise<ResourceServer[]> => {
      const out = await this.request<{ resourceServers: ResourceServer[] }>(
        'GET',
        '/v1/resource-servers',
      );
      return out.resourceServers ?? [];
    },
  };

  // ── 토큰 ────────────────────────────────────────────────────────────────

  /**
   * 위임장을 짧은 수명의 토큰으로 바꾼다.
   *
   * 이 호출은 **에이전트 자신이** 한다. 에이전트의 머신 자격증명이 필요하고,
   * Identity 는 그것이 이 위임장의 에이전트가 맞는지 확인한다 — 없으면 유효한
   * 머신 토큰 하나로 시스템의 모든 위임장을 쓸 수 있게 된다.
   */
  async issueAgentToken(options: IssueTokenOptions): Promise<IssuedToken> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.machineToken}`,
    };
    if (options.dpopProof) headers.DPoP = options.dpopProof;

    return this.send<IssuedToken>('POST', '/api/agent/token', headers, {
      grantId: options.grantId,
      audience: options.audience,
      scope: options.scope,
    });
  }

  // ── 내부 ────────────────────────────────────────────────────────────────

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.send<T>(
      method,
      path,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body,
    );
  }

  private async send<T>(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(stripUndefined(body)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }

    if (!response.ok) {
      const payload = parsed as { error?: string; details?: string; error_description?: string };
      throw new DelegationError(
        response.status,
        payload.error ?? 'unknown_error',
        payload.details ?? payload.error_description ?? `${method} ${path} → ${response.status}`,
        payload.details,
      );
    }
    return parsed as T;
  }
}

/**
 * `undefined` 인 칸을 지운다.
 *
 * JSON 으로 보내면 없는 칸이 되지만, 그렇게 되기 전에 지우는 편이 낫다 —
 * `expiresInDays: undefined` 를 그대로 보내면 서버가 0 으로 읽어 "만료 시각이
 * 과거" 로 거절하는, 원인을 찾기 어려운 실패가 된다.
 */
function stripUndefined(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** 위임을 만들고 거두는 서버용 클라이언트를 만든다. */
export function createDelegationClient(options: DelegationClientOptions): DelegationClient {
  return new DelegationClient(options);
}
