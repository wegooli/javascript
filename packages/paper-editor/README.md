# @wegooli/paper-editor

계약서를 읽고, 그 위에 서명란과 글자칸을 찍는 화면입니다.

파트너의 페이지가 이 화면을 직접 그립니다. Paper 사이트를 창 안에 끼워 넣지 않습니다. 임대인 브라우저는 Paper 주소를 보지 않습니다.

계산(칸의 위치, 글자 폭, 이름표)은 `@wegooli/paper-core`만 합니다. 서버와 열쇠는 `@wegooli/paper-client`만 압니다. 이 화면은 그 메서드를 부를 뿐, 주소나 열쇠 헤더를 만들지 않습니다.

## 넣는 법

```tsx
import { createPaperClient } from '@wegooli/paper-client';
import { TemplateEditor, TemplatePreview } from '@wegooli/paper-editor';
import '@wegooli/paper-editor/styles.css';

const paper = createPaperClient({
  baseUrl: 'https://paper.example',
  credential: { type: 'delegation', token },
});

<TemplateEditor client={paper} templateId={id} onSaved={(nextId) => { /* 저장된 양식 번호 */ }} />
<TemplatePreview client={paper} templateId={id} />
```

스타일 파일은 선택입니다. 안 가져와도 칸의 위치는 맞습니다. 가져오면 종이 위에 칸을 둔 것처럼 보입니다. 클래스 이름으로 파트너 디자인을 덮을 수 있습니다.

서비스 열쇠는 이 화면에 넣지 않습니다. 열쇠는 파트너 서버에 두고, 브라우저에는 위임 토큰을 주거나 서버가 같은 메서드 모양으로 중계합니다.

## 저장할 때

- 글자칸에 박아 둔 문구도 없고, 보낼 때 채울 이름도 없으면 저장되지 않습니다. 공백만 있어도 같습니다.
- 보낼 때 채울 이름이 이 회사에서 아직 쓴 적이 없으면, 사람이 확인하기 전에는 저장하지 않습니다. 이름 목록을 가져오지 못해도 저장하지 않습니다.
- 같은 이름이 두 칸에 있으면 알려 주기만 합니다. 두 칸에 같은 값이 들어갑니다.
- 기본으로 들어 있는 양식은 고칠 수 없습니다. 우리 양식으로 복사한 뒤에 고칩니다.

이미 있는 그림 칸과, 날짜·금액·체크 같은 칸의 종류는 저장할 때 빠지지 않습니다. 서명 자리의 역할 이름은 이 화면이 지우지 않습니다.

Node 22 이상. React 18 또는 19.
