import { describe, expect, it, vi } from 'vitest';

const opened = vi.hoisted(() => [] as Array<Record<string, unknown>>);

vi.mock('pdfjs-dist', async () => {
  const actual = await vi.importActual<typeof import('pdfjs-dist')>('pdfjs-dist');
  return {
    ...actual,
    getDocument: (params: Record<string, unknown>) => {
      opened.push(params);
      return actual.getDocument(params as Parameters<typeof actual.getDocument>[0]);
    },
  };
});

import { readPdfPages } from './pdf-pages';

/** xref 위치를 맞춰 한 쪽짜리 PDF를 만든다. */
function tinyPdf(width: number, height: number): ArrayBuffer {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] >>\nendobj\n`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(new TextEncoder().encode(body).length);
    body += object;
  }
  const xrefAt = new TextEncoder().encode(body).length;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += xref;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body).buffer;
}

describe('계약서 PDF', () => {
  it('작은 PDF를 열어 쪽 크기를 읽고, 문서 안 스크립트는 실행하지 않는다', async () => {
    const pages = await readPdfPages(tinyPdf(200, 100));
    expect(pages).toHaveLength(1);
    expect(pages[0]?.width).toBe(200);
    expect(pages[0]?.height).toBe(100);
    expect(opened[0]?.isEvalSupported).toBe(false);
  });
});
