import { describe, expect, it, vi } from 'vitest';

// 진짜 pdfjs 4 워커 파일은 **불러오는 순간** 전역 pdfjsWorker 를 스스로 채운다
// (pdf.worker.mjs 머리의 `globalThis.pdfjsWorker = {}`). 한 번 불러온 뒤에는
// 다시 채우지 않으므로, 이 파일은 처음 불러오는 상황만 따로 본다.
vi.mock('pdfjs-dist/build/pdf.worker.mjs', async () => {
  const actual = await vi.importActual<typeof import('pdfjs-dist/build/pdf.worker.mjs')>(
    'pdfjs-dist/build/pdf.worker.mjs',
  );
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = {
    WorkerMessageHandler: actual.WorkerMessageHandler,
  };
  return actual;
});

import { closePdfPages, readPdfPages } from './pdf-pages';

function tinyPdf(): ArrayBuffer {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] >>\nendobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(new TextEncoder().encode(body).length);
    body += object;
  }
  const xrefAt = new TextEncoder().encode(body).length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body).buffer;
}

describe('워커 파일을 처음 불러올 때', () => {
  it('워커 파일이 스스로 채운 전역도 치운다 — 같은 페이지의 react-pdf 가 버전 오류로 멈추지 않게', async () => {
    const scope = globalThis as { pdfjsWorker?: unknown };
    delete scope.pdfjsWorker;
    const pages = await readPdfPages(tinyPdf());
    expect('pdfjsWorker' in scope).toBe(false);
    expect(pages[0]).toMatchObject({ width: 300, height: 400 });
    await closePdfPages(pages);
  });
});
