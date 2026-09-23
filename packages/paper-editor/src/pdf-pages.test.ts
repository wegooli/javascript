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

import { closePdfPages, readPdfPages } from './pdf-pages';

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

function drawingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, isIdentity: true };
  const answers: Record<string, unknown> = {
    canvas,
    measureText: () => ({ width: 0 }),
    getTransform: () => matrix,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createPattern: () => ({}),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
  };
  return new Proxy({} as CanvasRenderingContext2D, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in answers) return answers[prop];
      if (prop in target) return target[prop as keyof CanvasRenderingContext2D];
      const method = () => undefined;
      (target as unknown as Record<string, unknown>)[String(prop)] = method;
      return method;
    },
    set(target, prop, value) {
      (target as unknown as Record<string, unknown>)[String(prop)] = value;
      return true;
    },
  });
}

describe('계약서 PDF', () => {
  it('작은 PDF를 열어 쪽 크기를 읽고, 그 다음에 그려도 실패하지 않는다', async () => {
    const pages = await readPdfPages(tinyPdf(200, 100));
    expect(pages).toHaveLength(1);
    expect(pages[0]?.width).toBe(200);
    expect(pages[0]?.height).toBe(100);
    expect(opened[0]?.isEvalSupported).toBe(false);

    const canvas = document.createElement('canvas');
    canvas.getContext = (() => drawingContext(canvas)) as unknown as HTMLCanvasElement['getContext'];
    const paint = pages[0]?.paint;
    expect(paint).toEqual(expect.any(Function));
    await expect(paint?.(canvas)).resolves.toBeUndefined();
    await closePdfPages(pages);
  });
});
