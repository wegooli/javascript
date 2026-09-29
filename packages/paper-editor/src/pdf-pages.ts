import { useCallback, useEffect, useRef, useState } from 'react';

import type { PageSize } from './types';

type PdfViewport = { width: number; height: number };

type PdfPage = {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => { promise: Promise<void> };
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type LoadingTask = {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
};

type PdfjsModule = {
  getDocument: (src: Record<string, unknown>) => LoadingTask;
};

type WorkerGlobal = typeof globalThis & {
  pdfjsWorker?: { WorkerMessageHandler?: unknown };
};

/**
 * pdfjs 4는 disableWorker를 무시한다. 워커 파일을 파트너가 따로 두지 않도록
 * 이 패키지가 워커 모듈을 불러 메인 스레드에서 읽게 한다.
 */

const openDocuments = new WeakMap<readonly PageSize[], () => Promise<void>>();

/**
 * pdfjs는 전역 pdfjsWorker가 있으면 버전을 따지지 않고 그 워커를 쓴다.
 * 파트너 페이지에 다른 버전의 pdfjs(react-pdf 등)가 있으면, 전역을 남겨 두는 순간
 * 그쪽 PDF가 "API 버전과 워커 버전이 다르다"로 열리지 않는다. 페이지를 옮겨도 남는다.
 *
 * 전역을 채우는 것은 둘이다. 이 패키지가 문서를 열 때, 그리고 **워커 파일 자신**이
 * 처음 불러와지는 순간(`pdf.worker.mjs` 머리의 `globalThis.pdfjsWorker = {}`).
 * 그래서 되돌릴 값은 워커 파일을 부르기 **전에** 적어 두고, 부른 직후와 문서를
 * 연 직후에 그 값으로 돌려놓는다.
 * 이 버전의 pdfjs는 여는 순간 워커를 읽어 자기 안에 기억하므로, 되돌려도 계속 읽힌다.
 */
type GlobalSnapshot = { had: boolean; value: WorkerGlobal['pdfjsWorker'] };

function snapshotGlobal(): GlobalSnapshot {
  const scope = globalThis as WorkerGlobal;
  return {
    had: Object.prototype.hasOwnProperty.call(scope, 'pdfjsWorker'),
    value: scope.pdfjsWorker,
  };
}

function restoreGlobal(snapshot: GlobalSnapshot): void {
  const scope = globalThis as WorkerGlobal;
  if (snapshot.had) scope.pdfjsWorker = snapshot.value;
  else delete scope.pdfjsWorker;
}

export async function readPdfPages(data: ArrayBuffer): Promise<PageSize[]> {
  const before = snapshotGlobal();
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs');
  // 워커 파일이 처음 불러와지며 채운 전역을 바로 치운다
  restoreGlobal(before);
  const pdfjs = (await import('pdfjs-dist')) as unknown as PdfjsModule;
  const scope = globalThis as WorkerGlobal;
  const around = snapshotGlobal();
  scope.pdfjsWorker = { WorkerMessageHandler: worker.WorkerMessageHandler };
  let task: LoadingTask;
  try {
    task = pdfjs.getDocument({
      data: new Uint8Array(data),
      isEvalSupported: false,
    });
  } finally {
    restoreGlobal(around);
  }
  try {
    const doc = await task.promise;
    const pages: PageSize[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      pages.push({
        width: viewport.width,
        height: viewport.height,
        paint: async (canvas) => {
          const context = canvas.getContext('2d');
          if (!context) return;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
        },
      });
    }
    openDocuments.set(pages, () => task.destroy());
    return pages;
  } catch (error) {
    await task.destroy().catch(() => undefined);
    throw error;
  }
}

/** 화면이 이 쪽들을 더 그리지 않을 때 문서를 닫는다. 읽자마자 부르면 그림이 실패한다. */
export function closePdfPages(pages: readonly PageSize[] | null | undefined): Promise<void> {
  if (!pages) return Promise.resolve();
  const close = openDocuments.get(pages);
  if (!close) return Promise.resolve();
  openDocuments.delete(pages);
  return close().catch(() => undefined);
}

/**
 * 읽어 둔 PDF는 컴포넌트가 살아있는 동안 그려야 한다.
 * 다른 PDF로 바꾸거나 화면이 사라질 때만 닫는다.
 */
export function usePdfPages(initial: readonly PageSize[] = []) {
  const [pages, setPages] = useState(initial);
  const owned = useRef<readonly PageSize[] | null>(null);
  const alive = useRef(true);

  const show = useCallback((next: readonly PageSize[], keepOpen: boolean) => {
    if (!alive.current) {
      if (keepOpen) void closePdfPages(next);
      return;
    }
    const previous = owned.current;
    owned.current = keepOpen ? next : null;
    setPages(next);
    if (previous && previous !== next) void closePdfPages(previous);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const current = owned.current;
      owned.current = null;
      void closePdfPages(current);
    };
  }, []);

  return { pages, show };
}

export async function thumbnailBlob(pages: readonly PageSize[]): Promise<Blob | null> {
  const first = pages[0];
  if (!first?.paint || typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    await first.paint(canvas);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  } catch {
    return null;
  }
}
