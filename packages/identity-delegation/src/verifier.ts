import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

import { TokenRejected } from './errors';
import type { AgentCaller } from './types';

export interface TokenVerifierOptions {
  /** Identity 주소. 토큰의 `iss` 와 정확히 같아야 한다 */
  issuer: string;
  /**
   * **내 서비스의 주소.** 토큰의 `aud` 가 이것이어야 통과한다.
   *
   * 필수다. 빼면 다른 서비스용으로 발급된 토큰이 여기서도 통과하고, 그 순간
   * 위임장의 "이 토큰은 어디로 갈 수 있다" 는 제한이 아무것도 막지 않게 된다.
   */
  audience: string;
  /** 기본은 `<issuer>/.well-known/jwks.json` */
  jwksUri?: string;
  /**
   * 매 요청마다 Identity 에 "이 위임이 아직 살아 있나" 를 묻는다.
   *
   * 안 물으면 취소를 토큰 수명(약 5분)만큼 늦게 본다. 계약서 발송처럼
   * 되돌리기 어려운 동작 앞에서는 켠다. 화면 하나 그리는 데는 안 켜도 된다.
   */
  introspect?: boolean;
  fetch?: typeof globalThis.fetch;
}

interface ActClaim {
  sub?: unknown;
  type?: unknown;
}

/**
 * Identity 가 발급한 위임 토큰을 검사한다.
 *
 * 기존 로그인 토큰과 다른 점은 하나다. 이 토큰은 "누가 불렀는가" 뿐 아니라
 * **"누구를 대신해서"** 를 담고 있다 (RFC 8693).
 *
 *   sub     = 책임 주체 — 이 요청의 결과에 책임지는 사람
 *   act.sub = 행위자   — 실제로 요청을 보낸 에이전트
 *
 * 순서가 거꾸로 보이지만 그게 요점이다. **sub 으로 권한을 판단하던 기존 코드가
 * 그대로 동작한다.** act 는 "사람이 아니라 기계가 했다" 를 기록에 남기고 싶을
 * 때만 읽으면 된다.
 *
 * 그리고 그 사람이 우리 로그인 사용자든 고객사 직원이든 **토큰 모양이 같다.**
 * 여기서 둘을 구별하는 분기를 쓸 일은 없다.
 */
export class TokenVerifier {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly introspectEnabled: boolean;
  private readonly doFetch: typeof globalThis.fetch;

  constructor(options: TokenVerifierOptions) {
    if (!options.issuer) throw new Error('issuer 가 필요합니다');
    if (!options.audience) {
      throw new Error(
        'audience 가 필요합니다 — 내 서비스 주소입니다. 빼면 다른 서비스용 토큰도 여기서 통과합니다.',
      );
    }
    this.issuer = options.issuer.replace(/\/+$/, '');
    this.audience = options.audience.replace(/\/+$/, '');
    this.introspectEnabled = options.introspect ?? false;
    this.doFetch = options.fetch ?? globalThis.fetch;
    // JWKS 는 한 번만 만든다 — 요청마다 만들면 캐시가 없는 것과 같아서 매번
    // Identity 로 나간다.
    this.jwks = createRemoteJWKSet(new URL(options.jwksUri ?? `${this.issuer}/.well-known/jwks.json`));
  }

  /**
   * `Authorization` 헤더나 토큰 문자열을 받아 검사한다.
   *
   * 실패는 전부 {@link TokenRejected} 다. **거절 이유를 응답에 그대로 실어
   * 보내지 않는다** — 어느 검사에서 걸렸는지 알려 주는 것은 공격자에게 다음
   * 시도의 힌트를 주는 일이다. 이유는 로그에만 남긴다.
   */
  async verify(authorizationOrToken: string): Promise<AgentCaller> {
    const token = stripScheme(authorizationOrToken);
    if (!token) throw new TokenRejected('no token');

    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['ES256'],
      });
      payload = verified.payload;
    } catch (err) {
      throw new TokenRejected((err as Error).message);
    }

    const principalId = typeof payload.sub === 'string' ? payload.sub : '';
    const act = (payload['act'] ?? null) as ActClaim | null;
    const agentId = act && typeof act.sub === 'string' ? act.sub : '';
    const grantId = typeof payload['gnt'] === 'string' ? payload['gnt'] : '';

    // 셋 다 있어야 위임 토큰이다. 서명은 통과했지만 이 중 하나라도 없으면
    // "누구를 대신하는지" 를 말할 수 없고, 그러면 이 경로로 받을 이유가 없다.
    if (!principalId || !agentId || !grantId) {
      throw new TokenRejected('sub / act.sub / gnt 중 빠진 것이 있어 위임 토큰이 아니다');
    }

    if (this.introspectEnabled && !(await this.stillLive(token))) {
      throw new TokenRejected('위임이 취소됐다', true);
    }

    const scopes = typeof payload['scope'] === 'string' ? payload['scope'].split(/\s+/).filter(Boolean) : [];

    return {
      principalId,
      principalKind: typeof payload['principal_kind'] === 'string' ? payload['principal_kind'] : undefined,
      agentId,
      agentType: act && typeof act.type === 'string' ? act.type : undefined,
      email: typeof payload['email'] === 'string' ? payload['email'] : undefined,
      instanceId: typeof payload['org'] === 'string' ? payload['org'] : undefined,
      // 회사는 `org` 가 아니라 이쪽이다. `org` 는 배포를 가리킨다.
      customerOrganizationId:
        typeof payload['customer_org'] === 'string' ? payload['customer_org'] : undefined,
      organizationId: typeof payload['org'] === 'string' ? payload['org'] : undefined,
      grantId,
      grantVersion: typeof payload['gv'] === 'number' ? payload['gv'] : undefined,
      scopes,
      audience: normalizeAudience(payload.aud),
      expiresAt: new Date((payload.exp ?? 0) * 1000),
      has: (scope: string) => scopes.includes(scope),
      claims: payload as Record<string, unknown>,
    };
  }

  /**
   * Identity 에 위임장이 아직 살아 있는지 묻는다.
   *
   * **네트워크가 안 되면 통과시킨다.** 서명과 만료는 이미 확인했고, Identity 가
   * 잠깐 안 뜬다고 정상 요청이 전부 막히는 편이 더 나쁘다. 확실히 거절된
   * 경우(401·403)에만 막는다.
   */
  private async stillLive(token: string): Promise<boolean> {
    try {
      const response = await this.doFetch(`${this.issuer}/api/agent/verify`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      return !(response.status === 401 || response.status === 403);
    } catch {
      return true;
    }
  }
}

/** 위임 토큰 검사기를 만든다. */
export function createTokenVerifier(options: TokenVerifierOptions): TokenVerifier {
  return new TokenVerifier(options);
}

/**
 * `Bearer …` 와 `DPoP …` 를 모두 받는다.
 *
 * 어떤 스킴으로 왔는지가 검사 여부를 정하면 안 된다 — 그러면 공격자가 스킴만
 * 바꿔서 검사를 피한다. 키에 묶였는지는 토큰 안의 `cnf` 가 정한다.
 */
function stripScheme(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  for (const scheme of ['bearer ', 'dpop ']) {
    if (lower.startsWith(scheme)) return trimmed.slice(scheme.length).trim();
  }
  return trimmed;
}

function normalizeAudience(aud: JWTPayload['aud']): string[] {
  if (typeof aud === 'string') return [aud];
  if (Array.isArray(aud)) return aud.filter((a): a is string => typeof a === 'string');
  return [];
}
