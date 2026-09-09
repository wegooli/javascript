/**
 * `@wegooli/identity-delegation` — 위임을 만들고, 거두고, 검사한다.
 *
 * 이 라이브러리가 있는 이유는 두 가지다.
 *
 * **1. 모든 고객이 똑같이 쓰는 부분이다.** 위임장을 만들고, 사람이 끄면
 *    거두고, 짧은 토큰을 받고, 받은 토큰을 검사한다 — 여기까지는 회사마다
 *    글자 하나 다르지 않다. 다른 것은 그 다음(자기 데이터를 자기 양식에
 *    어떻게 넣는가)이고, 그건 영원히 고객 몫이다.
 *
 * **2. 끄기가 빠지는 것을 막는다.** 검사만 제공하고 위임 만들기를 각자 짜게
 *    두면, 고객마다 다르게 짜게 되고 그중 몇은 반드시 끄는 자리가 빠진 채로
 *    나온다. 스페이스노트에서 실제로 그렇게 됐다 — "언제든 끌 수 있습니다" 라고
 *    화면에 적어 두고, 끄는 버튼이 없었다.
 *
 * ── 켜기 ────────────────────────────────────────────────────────────────────
 *
 * ```ts
 * const identity = createDelegationClient({
 *   baseUrl: 'https://api.freezz.kr',
 *   secretKey: process.env.WEGOOLI_SECRET_KEY!,
 * });
 *
 * // 우리 로그인을 쓰는 사람
 * const { grant } = await identity.grants.ensure({
 *   agentId,
 *   principalId: user.id,
 *   scope: 'sign:create',
 *   audience: 'https://sign.wegooli.com',
 *   expiresInDays: 90,
 *   consentEvidence: { wording: '계약서 작성 자동화', at: new Date().toISOString() },
 * });
 *
 * // 자체 인증을 쓰는 회사 — 진술을 서명해서 보낸다
 * const { grant, principal } = await identity.grants.ensure({
 *   agentId,
 *   principalAssertion: await signStatement(currentUser),
 *   scope: 'sign:create',
 *   audience: 'https://sign.wegooli.com',
 *   expiresInDays: 1,
 * });
 * ```
 *
 * ── 끄기 ────────────────────────────────────────────────────────────────────
 *
 * ```ts
 * await identity.grants.revoke(grant.id, '사용자가 화면에서 껐습니다');
 * ```
 *
 * ── 받은 토큰 검사하기 (리소스 서버 쪽) ─────────────────────────────────────
 *
 * ```ts
 * const verifier = createTokenVerifier({
 *   issuer: 'https://api.freezz.kr',
 *   audience: 'https://sign.wegooli.com',
 *   introspect: true, // 되돌리기 어려운 동작 앞에서는 켠다
 * });
 *
 * const caller = await verifier.verify(request.headers.get('authorization') ?? '');
 * if (!caller.has('sign:create')) return forbidden();
 *
 * await createContract({
 *   createdBy: caller.principalId,   // 책임지는 사람
 *   actorAgentId: caller.agentId,    // 실제로 누른 기계
 *   grantId: caller.grantId,         // 무엇이 허락돼 있었나
 * });
 * ```
 */

export { DelegationClient, createDelegationClient } from './client';
export type {
  DelegationClientOptions,
  EnsureGrantOptions,
  IssueTokenOptions,
  IssuedToken,
} from './client';

export { TokenVerifier, createTokenVerifier } from './verifier';
export type { TokenVerifierOptions } from './verifier';

export { DelegationError, TokenRejected } from './errors';

export type {
  AgentCaller,
  AssertedPrincipal,
  EnsureGrantResult,
  ExternalPrincipal,
  Grant,
  ResourceScope,
  ResourceServer,
} from './types';
