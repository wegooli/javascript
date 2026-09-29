---
"@wegooli/paper-editor": patch
---

pdfjs 4 워커 파일이 처음 불러와지며 스스로 채운 전역 `pdfjsWorker`도 치운다. 0.8.1은 불러온 뒤의 값을 「원래 값」으로 적어 두어, 되돌린다면서 그 워커를 그대로 남겼다. 같은 페이지의 react-pdf(pdfjs 5)가 계속 버전 오류로 PDF를 열지 못했다.
