# @wegooli/paper-editor

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
