# @wegooli/paper-client

계약서 양식 서버와 말하는 통로입니다. 화면이 아닙니다.

파트너 페이지가 계약서를 읽고 칸을 찍는 일은 `@wegooli/paper-editor`가 합니다. 그 화면은 여기의 메서드만 부르고, 주소나 열쇠 헤더를 직접 만들지 않습니다.

## 열쇠는 어디에 두나

서비스 열쇠는 파트너 **서버**에만 둡니다. 브라우저에서 서비스 열쇠로 클라이언트를 만들면, 요청을 보내기 전에 바로 거절합니다. 우회 스위치는 없습니다.

브라우저 화면에는 둘 중 하나를 씁니다.

- 짧은 **위임 토큰**. 사람이 로그인한 뒤에 파트너 서버가 나눠 준 값입니다.
- 파트너 서버가 이 패키지와 **같은 메서드 모양**으로 중계. 열쇠는 그 서버에 남습니다.

`ownerScope`(누구의 양식인지 적는 범위)는 서버가 준 문자열을 그대로 붙입니다. 콜론으로 쪼개 해석하지 않습니다. 회사 번호(`organizationId`)는 보내지 않습니다. 서버가 호출자를 보고 정합니다.

## 쓰는 법

```ts
import { createPaperClient } from '@wegooli/paper-client';

const paper = createPaperClient({
  baseUrl: 'https://paper.example',
  credential: { type: 'delegation', token },
  ownerScope: 'spacenote:building:123',
});

const template = await paper.getTemplate(templateId);
const pdf = await paper.getTemplatePdf(templateId);
```

서버에서만, 열쇠로:

```ts
const paper = createPaperClient({
  baseUrl: process.env.PAPER_BASE_URL!,
  credential: { type: 'service-key', apiKey: process.env.PAPER_API_KEY! },
  ownerScope: process.env.PAPER_OWNER_SCOPE,
});
```

기본 제공 양식을 고치려다 거절되면 오류 코드가 `system_template_readonly`입니다. 다시 고치려 하지 말고, `cloneTemplate`으로 복사한 뒤 그 번호를 고칩니다.

Node 22 이상.
