---
"@wegooli/paper-editor": patch
---

PDF를 읽은 뒤 전역 `pdfjsWorker`를 남기지 않는다. 남겨 두면 같은 페이지의 다른 버전 pdfjs(react-pdf 등)가 그 워커를 가져다 써서 "API 버전과 워커 버전이 다르다"로 PDF를 열지 못했다. 파트너가 먼저 둔 값은 그대로 돌려놓는다.
