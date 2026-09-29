---
"@wegooli/paper-core": minor
"@wegooli/paper-editor": patch
---

- paper-core: `dateInputKind`에 `month-day`가 생겼다. 「월만」과 「일만」을 한 날짜로 묶은 칸은 달력 대신 월과 일을 나란히 묻는다. 연·월·일이 모두 필요할 때만 달력이다.
- paper-editor: 날짜칸을 다른 날짜칸과 한 날짜로 묶어도 그 칸의 이름을 덮어쓰지 않는다. 묶인 칸들은 그중 하나에만 이름이 있어도 저장된다.
