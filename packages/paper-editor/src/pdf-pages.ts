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

type PdfjsModule = {
  getDocument: (src: Record<string, unknown>) => { promise: Promise<PdfDocument> };
};

/** 브라우저에서만 부른다. 워커 파일을 파트너가 호스트하지 않게 메인 스레드에서 읽는다. */
export async function readPdfPages(data: ArrayBuffer): Promise<PageSize[]> {
  const pdfjs = (await import('pdfjs-dist')) as unknown as PdfjsModule;
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    disableWorker: true,
  });
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
