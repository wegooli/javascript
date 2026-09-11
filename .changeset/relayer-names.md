---
'@wegooli/identity-types': minor
'@wegooli/identity-react': minor
'@wegooli/identity-delegation': minor
---

이름이 이제 층을 가리킨다 — `workspace` · `instance` · `organization`.

`organizationId` 는 한 이름으로 세 가지를 뜻해 왔습니다. 층이 하나뿐이던 때
붙은 이름이고, 층이 셋이 된 뒤에도 밖으로 나가는 이름은 일부러 그대로 뒀습니다
— 바꾸면 붙어 있는 모든 것이 한꺼번에 멎으니까요. 이번 릴리스는 **새 이름을
같이 내보냅니다.** 옛 이름은 그대로 옵니다.

```
workspace       개발사 계정 — 앱을 등록하고 팀을 두는 곳
instance        제품 × 환경 — 개발 · 샌드박스 · 운영. 회원 풀의 경계
organization    고객사 — 이 앱을 쓰는 회사. 이 이름은 여기 남습니다
```

**바뀐 것.** `Workspace`(= `Organization` 의 새 이름)와 `CustomerOrganization`
타입이 생겼습니다. `useAuth`·컨텍스트에 `workspace` 가 `organization` 과 나란히
옵니다. `Membership` 에 `workspaceId`·`workspaceSlug`·`workspaceName` 이,
`Grant`·`ExternalPrincipal` 에 `instanceId` 가 붙었습니다. 위임 토큰 검증
결과(`DelegatedCaller`)에는 `instanceId` 와 **`customerOrganizationId`** 가
생겼습니다.

⚠️ **`organizationId` 는 회사를 뜻하지 않습니다.** 위임 토큰에서 그 값은
배포(`instanceId`)이고, 회사는 새로 생긴 `customerOrganizationId` 입니다.
회사 단위로 무엇을 넓히고 있었다면 그쪽으로 옮기세요 — 옛 값으로 넓히면 한
작업공간에 든 서로 다른 회사가 서로의 것을 보게 됩니다.

**새 기능 하나.** `useCustomerOrganization()` — 이 사람이 속한 고객사 목록,
지금 일하고 있는 회사, 그리고 바꾸는 함수. `organization` 이 `null` 인 것이
정상입니다: 회사에 안 속했거나, 두 곳에 속했는데 아직 고르지 않았거나. 그걸
"첫 번째 회사" 로 읽지 마세요 — 사람이 고르지 않은 회사 이름으로 계약이 나가는
것은 화면 오류가 아닙니다.

옛 이름은 **아직 지우지 않습니다.** 지우는 것은 붙어 있는 쪽이 전부 옮긴 뒤의
메이저 릴리스입니다.
