# @wegooli/paper-client

## 0.3.0

### Minor Changes

- 860c6ae: 날짜칸의 모양을 정할 수 있다. `YYYY`(연), `M`·`MM`(월), `D`·`DD`(일)이 바뀌고 나머지 글자는 그대로 찍힌다. 예: `YYYY년 M월 D일` → 2026년 10월 1일. 「20**년 **월 \_\_일」처럼 칸이 나뉜 양식은 칸마다 연도만·월만·일만 고르고, 같은 날짜로 묶으면 보낼 때 달력은 하나만 뜬다.
  - paper-core: `formatDate`, `parseIsoDate`, `validateDateFormat`, `DEFAULT_DATE_FORMAT`
  - paper-client: 칸에 `dateFormat`
  - paper-editor: 날짜칸 설명판에 모양 입력·자주 쓰는 모양·미리보기, 다른 날짜칸과 같은 날짜 쓰기. 날짜칸은 색과 달력 표시로 글자칸과 갈린다. `EditorField`에 `dateFormat`이 생겼다.

## 0.2.0

### Minor Changes

- c6f0667: 계약서 양식을 읽고 서명란과 글자칸을 고치는 화면과, 그 화면이 서버에 말하는 클라이언트를 추가합니다. 빈 글자칸은 저장되지 않고, 기본 제공 양식은 복사한 뒤에만 고칩니다. npm에는 이 변경만으로 올리지 않습니다.

## 0.1.0

### Minor Changes

- 계약서 양식 서버에 말하고, 자격은 이 패키지만 붙입니다.

  화면을 그리지 않습니다. 서비스 열쇠는 브라우저에서 만들 수 없고, 위임 토큰만 브라우저에서 쓸 수 있습니다. 회사 번호는 보내지 않습니다.
