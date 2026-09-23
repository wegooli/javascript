import {
  DEFAULT_FONT_SIZE_PCT,
  TEXT_PADDING_PT,
  fontSizeFromPercent,
  maxTextWidth,
  percentBoxToTopLeft,
  topLeftToPercentBox,
  upperBoundTextWidth,
  type PercentBox,
  type TopLeftBox,
} from '@wegooli/paper-core';

import type { EditorField, PageSize } from './types';

export const SIGNATURE_BOX_PX = { width: 150, height: 60 };
export const TEXT_BOX_PX = { width: 160, height: 36 };

export function centeredBox(
  viewportWidth: number,
  viewportHeight: number,
  size: { width: number; height: number },
): TopLeftBox {
  return {
    x: viewportWidth / 2 - size.width / 2,
    y: viewportHeight / 2 - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

export function centeredPercent(
  viewportWidth: number,
  viewportHeight: number,
  size: { width: number; height: number },
): PercentBox {
  return topLeftToPercentBox(centeredBox(viewportWidth, viewportHeight, size), viewportWidth, viewportHeight);
}

/** 화면 픽셀로 바꾼 좌우 여백. 상수 2pt는 paper-core에만 있다. */
export function paddingOnScreen(viewportWidth: number, pageWidth: number): number {
  if (!(pageWidth > 0)) return TEXT_PADDING_PT;
  return TEXT_PADDING_PT * (viewportWidth / pageWidth);
}

export function fittedBoxWidthPx(args: {
  measure: (text: string, size: number) => number;
  text: string;
  fontPercent: number;
  viewportWidth: number;
  viewportHeight: number;
  pageWidth: number;
  currentWidthPx: number;
}): number {
  const fontPx = fontSizeFromPercent(args.fontPercent, args.viewportHeight);
  const measured = upperBoundTextWidth(args.measure, args.text, fontPx);
  if (!(measured > 0)) return args.currentWidthPx;
  const pad = paddingOnScreen(args.viewportWidth, args.pageWidth);
  const limit = maxTextWidth(args.currentWidthPx, pad);
  if (measured <= limit) return args.currentWidthPx;
  return measured + pad * 2;
}

function keepInside(box: TopLeftBox, viewportWidth: number, viewportHeight: number): TopLeftBox {
  const maxX = Math.max(0, viewportWidth - box.width);
  const maxY = Math.max(0, viewportHeight - box.height);
  return {
    x: Math.min(Math.max(0, box.x), maxX),
    y: Math.min(Math.max(0, box.y), maxY),
    width: box.width,
    height: box.height,
  };
}

export function shiftPercent(
  field: Pick<EditorField, 'posX' | 'posY' | 'width' | 'height'>,
  viewportWidth: number,
  viewportHeight: number,
  dx: number,
  dy: number,
): PercentBox {
  const current = percentBoxToTopLeft(field, viewportWidth, viewportHeight);
  const moved = keepInside(
    {
      x: current.x + dx,
      y: current.y + dy,
      width: current.width,
      height: current.height,
    },
    viewportWidth,
    viewportHeight,
  );
  return topLeftToPercentBox(moved, viewportWidth, viewportHeight);
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newSignatureField(pageNumber: number, page: PageSize): EditorField {
  const box = centeredPercent(page.width, page.height, SIGNATURE_BOX_PX);
  return {
    id: newId(),
    pageNumber,
    ...box,
    required: false,
    type: 'SIGNATURE',
    imageFileKey: null,
    imageMime: null,
    imageUrl: null,
    textContent: null,
    fontSize: null,
    label: null,
    paramKey: null,
    signerSlot: 1,
    inputType: null,
  };
}

export function newTextField(pageNumber: number, page: PageSize): EditorField {
  const box = centeredPercent(page.width, page.height, TEXT_BOX_PX);
  return {
    id: newId(),
    pageNumber,
    ...box,
    required: false,
    type: 'TEXT',
    imageFileKey: null,
    imageMime: null,
    imageUrl: null,
    textContent: '',
    fontSize: DEFAULT_FONT_SIZE_PCT,
    label: null,
    paramKey: null,
    signerSlot: 1,
    inputType: 'TEXT',
  };
}
