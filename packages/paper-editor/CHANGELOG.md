# @wegooli/paper-editor

## 0.10.1

### Patch Changes

- 39e934f: - paper-core: `dateInputKind`에 `month-day`가 생겼다. 「월만」과 「일만」을 한 날짜로 묶은 칸은 달력 대신 월과 일을 나란히 묻는다. 연·월·일이 모두 필요할 때만 달력이다.
  - paper-editor: 날짜칸을 다른 날짜칸과 한 날짜로 묶어도 그 칸의 이름을 덮어쓰지 않는다. 묶인 칸들은 그중 하나에만 이름이 있어도 저장된다.
- Updated dependencies [39e934f]
  - @wegooli/paper-core@0.4.0

## 0.10.0

### Minor Changes

- f0f6901: 일반인이 쓰기 쉽게 글자칸·날짜칸 설명을 바꾼다.
  - 글자칸은 「보낼 때마다 적기」와 「항상 같은 글자」 둘 중 하나를 고른다. 새 글자칸은 「보낼 때마다 적기」로 시작하고, 사람은 칸 이름만 적는다. 보낼 때 채울 이름(field_1, date_1 …)은 편집기가 붙인다.
  - 편집기가 붙인 이름으로는 「아직 쓴 적 없는 이름」 확인 창을 띄우지 않는다.
  - 「고급 · 외부 연동」은 「다른 프로그램과 연결 (개발자용)」로 바꾸고, 보낼 때마다 적는 칸에만 보인다.
  - 날짜칸: 칸 이름, 한 날짜로 묶기, 모양 단추가 먼저이고 직접 적기는 따로 연다. 고른 모양 단추가 눈에 띈다.
  - 계약서 위의 「보낼 때마다 적기」 칸은 칸 이름을 보여 준다.
  - paper-core: `dateParts`, `dateInputKind`, `isoFromParts` — 보내는 화면이 날짜 모양에 맞춰 연도만·월만·일만 묻게 한다.

### Patch Changes

- Updated dependencies [f0f6901]
  - @wegooli/paper-core@0.3.0

## 0.9.1

### Patch Changes

- 27b9840: pdfjs 4 워커 파일이 처음 불러와지며 스스로 채운 전역 `pdfjsWorker`도 치운다. 0.8.1은 불러온 뒤의 값을 「원래 값」으로 적어 두어, 되돌린다면서 그 워커를 그대로 남겼다. 같은 페이지의 react-pdf(pdfjs 5)가 계속 버전 오류로 PDF를 열지 못했다.

## 0.9.0

### Minor Changes

- 860c6ae: 날짜칸의 모양을 정할 수 있다. `YYYY`(연), `M`·`MM`(월), `D`·`DD`(일)이 바뀌고 나머지 글자는 그대로 찍힌다. 예: `YYYY년 M월 D일` → 2026년 10월 1일. 「20**년 **월 \_\_일」처럼 칸이 나뉜 양식은 칸마다 연도만·월만·일만 고르고, 같은 날짜로 묶으면 보낼 때 달력은 하나만 뜬다.
  - paper-core: `formatDate`, `parseIsoDate`, `validateDateFormat`, `DEFAULT_DATE_FORMAT`
  - paper-client: 칸에 `dateFormat`
  - paper-editor: 날짜칸 설명판에 모양 입력·자주 쓰는 모양·미리보기, 다른 날짜칸과 같은 날짜 쓰기. 날짜칸은 색과 달력 표시로 글자칸과 갈린다. `EditorField`에 `dateFormat`이 생겼다.

### Patch Changes

- Updated dependencies [860c6ae]
  - @wegooli/paper-core@0.2.0
  - @wegooli/paper-client@0.3.0

## 0.8.1

### Patch Changes

- d12e352: PDF를 읽은 뒤 전역 `pdfjsWorker`를 남기지 않는다. 남겨 두면 같은 페이지의 다른 버전 pdfjs(react-pdf 등)가 그 워커를 가져다 써서 "API 버전과 워커 버전이 다르다"로 PDF를 열지 못했다. 파트너가 먼저 둔 값은 그대로 돌려놓는다.

## 0.8.0

### Minor Changes

- 15f87e9: `title`이 바뀌어도 계약서를 다시 읽지 않는다. 찍어 둔 칸이 남고, 저장할 때 마지막 이름을 보낸다. 양식을 고칠 때도 `title`을 주면 그 이름으로 저장한다. `description`을 주면 설명도 저장하고, `onFieldsChange`로 칸이 바뀔 때마다 앱에 알린다.

## 0.7.0

### Minor Changes

- e54b2ec: 새 양식에 날짜칸과 도장·그림을 놓을 수 있다. 날짜칸은 칸의 종류가 그대로 글자칸이고, 보내는 분이 달력으로 채운다. 이름표가 없는 날짜칸은 저장하지 않는다. 도장·그림은 앱이 넘긴 `uploadImage`로 올리며, 넘기지 않으면 단추가 나오지 않는다.

## 0.6.0

### Minor Changes

- 810afa6: 계약서 위에 칸을 끌어다 놓을 수 있다. 글자칸은 누가 채우는지 한 장으로 묻고, 서명하는 분이 두 명 이상이면 칸 색이 달라진다.

## 0.5.0

### Minor Changes

- a65a276: 칸을 누르면 필수 입력인지 고를 수 있다. 필수 칸에는 빨간 별이 붙는다.

## 0.4.0

### Minor Changes

- 5cb41d8: 양식 편집 화면을 Paper에서 칸을 놓는 모습에 맞춘다. 베이지 바탕과 알약 단추를 없앤다.

## 0.3.0

### Minor Changes

- 5645e84: 계약서 위에 칸을 끌어 옮기고, 크기를 바꾸고, 글자칸에 이름을 붙일 수 있다.

## 0.2.0

### Minor Changes

- c6f0667: 계약서 양식을 읽고 서명란과 글자칸을 고치는 화면과, 그 화면이 서버에 말하는 클라이언트를 추가합니다. 빈 글자칸은 저장되지 않고, 기본 제공 양식은 복사한 뒤에만 고칩니다. npm에는 이 변경만으로 올리지 않습니다.

### Patch Changes

- Updated dependencies [c6f0667]
  - @wegooli/paper-client@0.2.0

## 0.1.0

### Minor Changes

- 계약서 PDF를 읽고 서명란과 글자칸을 찍는 화면을 추가합니다.

  파트너 페이지가 직접 그립니다. 빈 글자칸은 저장 전에 막히고, 기본 제공 양식은 복사한 뒤에만 고칠 수 있습니다. 위치와 이름표 계산은 paper-core만 쓰고, 서버 말은 paper-client만 합니다.
