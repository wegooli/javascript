# @wegooli/identity-delegation

## 0.3.0

### Minor Changes

- c78dc8a: 이름이 이제 층을 가리킨다 — `workspace` · `instance` · `organization`.

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

## 0.2.0

### Minor Changes

- 8403380: 위임을 만들고·거두고·검사하는 서버 라이브러리와, 사람이 자기 화면에서 끄는 조각

  `@wegooli/identity-delegation` 이 새로 생겼습니다. 위임장 만들기·목록·거두기,
  토큰 발급, 그리고 받은 토큰 검사까지를 한 곳에 담았습니다. 여기까지는 회사마다
  글자 하나 다르지 않은 부분이고, 각자 짜게 두면 그중 몇은 반드시 **끄는 자리가
  빠진 채로** 나옵니다.

  `@wegooli/identity-ui` 에는 `<DelegationManager />` 가 추가됐습니다. "지금
  무엇을 위임했고 누가 쓰고 있나 / 끄기" 를 그립니다. 스스로 네트워크를 쓰지
  않습니다 — 위임 API 는 `sk_` 비밀 키로 인증하므로 반드시 고객사 서버를 거쳐야
  하고, 그 키가 브라우저에 있으면 누구나 그 조직의 모든 위임을 지울 수 있습니다.

  검사기는 `audience` 없이는 만들 수 없습니다. 빼면 다른 서비스용으로 발급된
  토큰이 여기서도 통과하고, 그 순간 위임장의 "이 토큰은 어디로 갈 수 있다" 는
  제한이 아무것도 막지 않게 됩니다.
