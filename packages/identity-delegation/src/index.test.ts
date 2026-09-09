import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DelegationError, TokenRejected, createDelegationClient, createTokenVerifier } from './index';

// ── 서명 키와 JWKS 를 실제 소켓으로 서빙한다 ────────────────────────────────
//
// 검사기는 JWKS 를 네트워크에서 가져온다. 그 부분을 흉내 내면 "실제로는 못
// 가져오는데 테스트만 통과" 하는 결함이 그대로 남는다. 그래서 진짜로 띄운다.

let jwksServer: Server;
let jwksUri: string;
let signer: Awaited<ReturnType<typeof generateKeyPair>>;
const KID = 'test-key-1';

beforeAll(async () => {
  signer = await generateKeyPair('ES256');
  const jwk = await exportJWK(signer.publicKey);

  jwksServer = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: 'ES256', use: 'sig' }] }));
  });
  await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
  const { port } = jwksServer.address() as AddressInfo;
  jwksUri = `http://127.0.0.1:${port}/.well-known/jwks.json`;
});

afterAll(() => {
  jwksServer?.close();
});

const ISSUER = 'https://identity.example.com';
const AUDIENCE = 'https://sign.example.com';

async function mintToken(overrides: Record<string, unknown> = {}, audience = AUDIENCE) {
  return new SignJWT({
    act: { sub: 'agent-1', type: 'service' },
    org: 'org-1',
    gnt: 'grant-1',
    gv: 1,
    scope: 'sign:read sign:create',
    principal_kind: 'external_user',
    email: 'kim@freezz.example',
    ...overrides,
  })
    .setProtectedHeader({ alg: 'ES256', kid: KID })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setSubject('principal-1')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(signer.privateKey);
}

function verifier(options: Partial<Parameters<typeof createTokenVerifier>[0]> = {}) {
  return createTokenVerifier({ issuer: ISSUER, audience: AUDIENCE, jwksUri, ...options });
}

describe('토큰 검사', () => {
  it('위임 토큰에서 책임 주체와 행위자를 갈라 준다', async () => {
    const caller = await verifier().verify(`Bearer ${await mintToken()}`);

    expect(caller.principalId).toBe('principal-1');
    expect(caller.agentId).toBe('agent-1');
    expect(caller.grantId).toBe('grant-1');
    expect(caller.has('sign:create')).toBe(true);
    expect(caller.has('sign:delete')).toBe(false);
  });

  it('우리 로그인 사용자든 고객사 직원이든 같은 모양으로 읽힌다', async () => {
    // 값의 출처만 다르고 자리와 형식이 같다는 것이, 받는 쪽이 코드를 고치지
    // 않아도 되는 이유다. 여기서 분기가 필요해지면 설계가 틀린 것이다.
    const ours = await verifier().verify(await mintToken({ principal_kind: 'user' }));
    const theirs = await verifier().verify(await mintToken({ principal_kind: 'external_user' }));

    expect(Object.keys(ours).sort()).toEqual(Object.keys(theirs).sort());
    expect(theirs.email).toBe('kim@freezz.example');
  });

  it('DPoP 스킴으로 와도 똑같이 읽는다', async () => {
    // 스킴으로 검사 여부를 정하면 공격자가 스킴만 바꿔 검사를 피한다.
    const caller = await verifier().verify(`DPoP ${await mintToken()}`);
    expect(caller.principalId).toBe('principal-1');
  });

  it('다른 서비스용으로 발급된 토큰은 거절한다', async () => {
    const token = await mintToken({}, 'https://someone-else.example.com');
    await expect(verifier().verify(token)).rejects.toBeInstanceOf(TokenRejected);
  });

  it('audience 없이는 검사기를 만들 수 없다', () => {
    // 빼면 남의 서비스용 토큰이 통과하고, 위임장의 "어디로 갈 수 있다" 는
    // 제한이 아무것도 막지 않게 된다.
    expect(() => createTokenVerifier({ issuer: ISSUER, audience: '' })).toThrow(/audience/);
  });

  it('위임 정보가 없는 토큰은 서명이 맞아도 거절한다', async () => {
    const notADelegation = await new SignJWT({ scope: 'sign:read' })
      .setProtectedHeader({ alg: 'ES256', kid: KID })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setSubject('someone')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(signer.privateKey);

    await expect(verifier().verify(notADelegation)).rejects.toThrow(TokenRejected);
  });

  it('introspect 를 켜면 취소된 위임을 즉시 막는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    const v = verifier({ introspect: true, fetch: fetchMock as unknown as typeof fetch });

    await expect(v.verify(await mintToken())).rejects.toMatchObject({ revoked: true });
  });

  it('introspect 중 네트워크가 끊기면 통과시킨다', async () => {
    // 서명과 만료는 이미 확인했다. Identity 가 잠깐 안 뜬다고 정상 요청이 전부
    // 막히는 편이 더 나쁘다 — 확실히 거절된 경우에만 막는다.
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const v = verifier({ introspect: true, fetch: fetchMock as unknown as typeof fetch });

    const caller = await v.verify(await mintToken());
    expect(caller.principalId).toBe('principal-1');
  });
});

describe('위임 만들기와 거두기', () => {
  function clientWith(handler: (url: string, init: RequestInit) => Response) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchMock = ((url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(handler(url, init));
    }) as unknown as typeof fetch;
    const client = createDelegationClient({
      baseUrl: 'https://identity.example.com/',
      secretKey: 'sk_live_test',
      fetch: fetchMock,
    });
    return { client, calls };
  }

  const ok = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

  it('공개 키를 비밀 키 자리에 넣으면 거절한다', () => {
    expect(() =>
      createDelegationClient({ baseUrl: 'https://x.example', secretKey: 'pk_dev_abc' }),
    ).toThrow(/sk_/);
  });

  it('principalId 와 진술 중 정확히 하나여야 한다', async () => {
    const { client } = clientWith(() => ok({}));

    await expect(
      client.grants.ensure({
        agentId: 'a', scope: 's', audience: 'https://x.example',
      }),
    ).rejects.toThrow(/정확히 하나/);

    await expect(
      client.grants.ensure({
        agentId: 'a', principalId: 'p', principalAssertion: 'jwt',
        scope: 's', audience: 'https://x.example',
      }),
    ).rejects.toThrow(/정확히 하나/);
  });

  it('audience 는 하나를 줘도 목록으로 보낸다', async () => {
    const { client, calls } = clientWith(() => ok({ grant: { id: 'g1' }, created: true }));
    await client.grants.ensure({
      agentId: 'a', principalId: 'p', scope: 'sign:create',
      audience: 'https://sign.example.com', expiresInDays: 1,
    });

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.allowedAudiences).toEqual(['https://sign.example.com']);
  });

  it('보내지 않은 칸은 아예 빼고 보낸다', async () => {
    // `expiresInDays: undefined` 를 그대로 보내면 서버가 0 으로 읽어
    // "만료 시각이 과거" 로 거절하는, 원인을 찾기 어려운 실패가 된다.
    const { client, calls } = clientWith(() => ok({ grant: { id: 'g1' }, created: true }));
    await client.grants.ensure({
      agentId: 'a', principalId: 'p', scope: 's',
      audience: 'https://x.example', expiresAt: '2026-12-31T00:00:00Z',
    });

    const body = JSON.parse(String(calls[0].init.body));
    expect('expiresInDays' in body).toBe(false);
    expect(body.expiresAt).toBe('2026-12-31T00:00:00Z');
  });

  it('끄기는 한 줄이고, 이유가 함께 남는다', async () => {
    const { client, calls } = clientWith(() => new Response('', { status: 200 }));
    await client.grants.revoke('g1', '사용자가 화면에서 껐습니다');

    expect(calls[0].url).toBe('https://identity.example.com/v1/agent-grants/g1/revoke');
    expect(JSON.parse(String(calls[0].init.body)).reason).toBe('사용자가 화면에서 껐습니다');
  });

  it('껐던 위임을 되살리려 하면 그것이라고 말해 준다', async () => {
    // 오류가 아니라 설계다. 다시 켜려면 사람이 화면에서 다시 동의해야 한다.
    const { client } = clientWith(
      () => new Response(JSON.stringify({ error: 'grant_revoked' }), { status: 409 }),
    );

    await expect(
      client.grants.ensure({
        agentId: 'a', principalId: 'p', scope: 's', audience: 'https://x.example', expiresInDays: 1,
      }),
    ).rejects.toSatisfy((e: unknown) => e instanceof DelegationError && e.isRevokedByPrincipal);
  });

  it('거절된 진술은 진술 문제라고 말해 준다', async () => {
    const { client } = clientWith(
      () => new Response(JSON.stringify({ error: 'assertion_wrong_audience' }), { status: 403 }),
    );

    await expect(
      client.grants.ensure({
        agentId: 'a', principalAssertion: 'jwt', scope: 's',
        audience: 'https://x.example', expiresInDays: 1,
      }),
    ).rejects.toSatisfy((e: unknown) => e instanceof DelegationError && e.isAssertionRejected);
  });
});
