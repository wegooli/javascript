# @wegooli/paper-core

## 0.2.0

### Minor Changes

- 860c6ae: 날짜칸의 모양을 정할 수 있다. `YYYY`(연), `M`·`MM`(월), `D`·`DD`(일)이 바뀌고 나머지 글자는 그대로 찍힌다. 예: `YYYY년 M월 D일` → 2026년 10월 1일. 「20**년 **월 \_\_일」처럼 칸이 나뉜 양식은 칸마다 연도만·월만·일만 고르고, 같은 날짜로 묶으면 보낼 때 달력은 하나만 뜬다.
  - paper-core: `formatDate`, `parseIsoDate`, `validateDateFormat`, `DEFAULT_DATE_FORMAT`
  - paper-client: 칸에 `dateFormat`
  - paper-editor: 날짜칸 설명판에 모양 입력·자주 쓰는 모양·미리보기, 다른 날짜칸과 같은 날짜 쓰기. 날짜칸은 색과 달력 표시로 글자칸과 갈린다. `EditorField`에 `dateFormat`이 생겼다.

## 0.1.0

### Minor Changes

- 93506de: 칸의 위치, 글자가 칸을 넘지 않는 폭, 이름표 검사를 한 곳에 둡니다.

  이 패키지는 종이를 그리지 않습니다. 화면을 기억하지도 않습니다. 같은 칸과 같은 글자와 같은 이름표를 넣으면, Paper와 나중에 만들 편집기가 같은 숫자를 내도록 그 계산만 담습니다. 양식을 읽고 고치는 화면은 이 패키지가 아닙니다.
