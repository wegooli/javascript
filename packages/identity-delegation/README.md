# @wegooli/identity-delegation

위임을 **만들고, 거두고, 검사하는** 서버용 라이브러리.

AI 에게 사람 대신 일을 시키려면 세 가지가 필요합니다. 누가 무엇을 허락했는지
기록하고, 그 사람이 마음을 바꾸면 즉시 끄고, 받은 쪽이 "이게 정말 허락된
일인가" 를 확인하는 것. **이 세 가지는 회사마다 글자 하나 다르지 않습니다.**
다른 것은 그다음 — 자기 데이터를 자기 양식에 어떻게 넣는가 — 이고, 그건 영원히
고객 몫입니다.

> ⚠️ **서버에서만 씁니다.** `sk_` 비밀 키로 인증하므로 브라우저에 들어가면
> 누구나 이 조직의 모든 위임을 만들고 지울 수 있습니다. 브라우저에서
> 불러들이면 라이브러리가 즉시 오류를 냅니다.

## 설치

```bash
npm install @wegooli/identity-delegation
```

Node 20 이상.

## 켜기 — 사람이 스위치를 눌렀을 때

```ts
import { createDelegationClient } from '@wegooli/identity-delegation';

const identity = createDelegationClient({
  baseUrl: 'https://api.freezz.kr',
  secretKey: process.env.WEGOOLI_SECRET_KEY!,
});

const { grant } = await identity.grants.ensure({
  agentId,
  principalId: user.id,
  scope: 'sign:create',
  audience: 'https://sign.wegooli.com',
  expiresInDays: 90,
  consentEvidence: { wording: '계약서 작성 자동화', at: new Date().toISOString() },
});
```

**같은 (에이전트, 사람) 조합으로 여러 번 불러도 위임장은 하나입니다.** 사람은
스위치를 두 번 누르고, 위임장이 둘이면 끌 때 하나만 꺼서는 안 멈춥니다.

### 자체 인증을 쓰는 회사라면

직원이 우리 로그인을 거치지 않으므로 `principalId` 가 없습니다. 대신 **그 회사
인증서버가 서명한 진술**을 보냅니다 — "지금 이 버튼을 누른 사람은 우리 직원
아무개다".

```ts
const { grant, principal } = await identity.grants.ensure({
  agentId,
  principalAssertion: await ourAuthServer.signStatement(currentUser),
  scope: 'sign:create',
  audience: 'https://sign.wegooli.com',
  expiresInDays: 1,
});
```

이 경우 **같은 호출이 갱신도 겸합니다.** 새 진술을 붙여 다시 부르면 만료일이
하루 뒤로 밀립니다. 사람이 퇴사해 진술을 못 만들게 되면, 아무도 아무것도 안
해도 위임장이 하루 안에 스스로 닫힙니다.

진술을 만드는 법은
[외부 주체 위임 연동 계약](https://github.com/wegooli/identity/blob/main/docs/integration/22-외부-주체-위임-연동-계약.md)
을 보세요.

## 끄기

```ts
await identity.grants.revoke(grant.id, '사용자가 화면에서 껐습니다');
```

**다음 검증 시점에 바로** 먹습니다. 이미 나가 있는 토큰도 함께 무효가 됩니다.

이유를 남기면 나중에 "왜 멈췄나" 에 답할 수 있습니다 — 사람이 껐는지, 관리자가
껐는지, 사고 대응이었는지는 전부 다른 이야기입니다.

### 껐던 것을 다시 켜려 하면 거절됩니다

```ts
try {
  await identity.grants.ensure({ /* … */ });
} catch (e) {
  if (e instanceof DelegationError && e.isRevokedByPrincipal) {
    // 사람이 껐던 위임이다. 화면에서 다시 동의를 받고 reconsent: true 로 보낸다.
  }
}
```

오류가 아니라 **설계**입니다. 사람이 끈 위임을 백엔드가 조용히 다시 만들면 그
사람이 누른 스위치는 아무것도 안 한 게 됩니다.

## 받은 토큰 검사하기 (리소스 서버 쪽)

```ts
import { createTokenVerifier } from '@wegooli/identity-delegation';

const verifier = createTokenVerifier({
  issuer: 'https://api.freezz.kr',
  audience: 'https://sign.wegooli.com', // 내 서비스 주소. 필수입니다
  introspect: true, // 되돌리기 어려운 동작 앞에서는 켭니다
});

const caller = await verifier.verify(request.headers.get('authorization') ?? '');
if (!caller.has('sign:create')) return forbidden();

await createContract({
  createdBy: caller.principalId, // 책임지는 사람
  actorAgentId: caller.agentId,  // 실제로 누른 기계
  grantId: caller.grantId,       // 무엇이 허락돼 있었나
});
```

### 토큰이 담고 있는 것

이 토큰은 "누가 불렀는가" 뿐 아니라 **"누구를 대신해서"** 를 담습니다
(RFC 8693).

| | |
|---|---|
| `caller.principalId` | 책임 주체 — 토큰의 `sub` |
| `caller.agentId` | 행위자 — 토큰의 `act.sub` |
| `caller.email` | 책임 주체의 이메일 |
| `caller.grantId` / `grantVersion` | 어느 위임장에서 나온 권한인가 |

순서가 거꾸로 보이지만 그게 요점입니다. **`sub` 으로 권한을 판단하던 기존
코드가 그대로 동작합니다.** `act` 는 "사람이 아니라 기계가 했다" 를 기록에
남기고 싶을 때만 읽으면 됩니다.

그리고 그 사람이 우리 로그인 사용자든 고객사 직원이든 **토큰 모양이 같습니다.**
둘을 구별하는 분기를 쓸 일은 없습니다.

### `audience` 는 필수입니다

빼면 **다른 서비스용으로 발급된 토큰이 여기서도 통과합니다.** 그러면 위임장의
"이 토큰은 어디로 갈 수 있다" 는 제한이 아무것도 막지 않게 됩니다.

### `introspect` 를 켜는 기준

끄면 위임 취소를 토큰 수명(약 5분)만큼 늦게 봅니다. 계약서 발송처럼 되돌리기
어려운 동작 앞에서는 켜고, 화면 하나 그리는 데는 켜지 않아도 됩니다.

네트워크가 끊기면 **통과시킵니다.** 서명과 만료는 이미 확인했고, Identity 가
잠깐 안 뜬다고 정상 요청이 전부 막히는 편이 더 나쁩니다. 확실히 거절된
경우(401·403)에만 막습니다.

## 내 서비스의 권한 이름 선언하기

동의 화면이 그리는 문장은 **그 권한을 가진 서비스가 씁니다.** 우리가 지어내지
않습니다.

```ts
await identity.resourceServers.declare({
  identifier: 'https://sign.wegooli.com', // 토큰 aud 에 들어갈 값
  displayName: '전자서명',
  scopes: [
    {
      name: 'sign:read',
      displayName: '내 전자서명 문서를 읽습니다',
      description: '제목·상태·만든 날짜를 봅니다. 문서 내용은 보지 않습니다.',
    },
    {
      name: 'sign:create',
      displayName: '내 이름으로 계약을 만들고 보냅니다',
      description: '상대에게 서명 링크가 발송됩니다.',
      isSensitive: true, // 되돌리기 어려운 권한은 화면에서 눈에 띄게 그립니다
    },
  ],
});
```

배포할 때마다 불러도 됩니다 — 주소가 같으면 행이 하나로 유지되고, 선언은
통째로 바뀝니다. **권한 하나를 목록에서 빼면 그 권한은 더 이상 위임될 수
없습니다.**

`displayName` 은 **1인칭 현재형**으로 씁니다. 읽는 사람은 개발자가 아니라
"내 이름으로 무슨 일이 벌어지는가" 를 판단하는 사람입니다.

## 끄기 화면

사람이 자기 화면에서 끄는 조각은 `@wegooli/identity-ui` 의
`<DelegationManager />` 입니다. 그 컴포넌트는 스스로 네트워크를 쓰지 않고,
`onRevoke` 를 이 라이브러리의 `grants.revoke()` 에 연결해서 씁니다 —
비밀 키가 브라우저로 나가지 않게 하려는 것입니다.

## 끄는 곳은 두 군데입니다

| 누가 | 어디서 | 왜 |
|---|---|---|
| 본인 | 고객사 화면 (`<DelegationManager />`) | 자기가 아는 화면 |
| 회사 | Wegooli 대시보드 | **고객사 시스템이 통째로 멈춰도 듣습니다** |

두 번째가 이 제품을 쓰는 이유입니다. 첫 번째만 있으면 시스템이 고장 났을 때
끄는 방법도 같이 고장 납니다.
