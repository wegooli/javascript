import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

describe('계산을 다시 적지 않는다', () => {
  it('화면 소스에 페이지 높이를 빼는 식, 용지 상수, 열쇠 헤더가 없다', () => {
    const root = path.dirname(fileURLToPath(import.meta.url));
    const banned = ['841' + '.89', 'pageHeight' + ' ' + '-', 'X-API' + '-' + 'Key', 'percentBoxTo' + 'PdfRect'];
    const offenders: string[] = [];
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const token of banned) {
        if (text.includes(token)) offenders.push(`${path.relative(root, file)}: ${token}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
