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
async function loadMainThreadWorker(): Promise<void> {
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs');
  const scope = globalThis as WorkerGlobal;
  if (!scope.pdfjsWorker?.WorkerMessageHandler) {
    scope.pdfjsWorker = { WorkerMessageHandler: worker.WorkerMessageHandler };
  }
}

export async function readPdfPages(data: ArrayBuffer): Promise<PageSize[]> {
  await loadMainThreadWorker();
  const pdfjs = (await import('pdfjs-dist')) as unknown as PdfjsModule;
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    isEvalSupported: false,
  });
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
    return pages;
  } finally {
    await task.destroy();
  }
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
