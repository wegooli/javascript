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
export const IMAGE_BOX_PX = { width: 120, height: 120 };

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

/** 떨어뜨린 지점이 칸의 가운데가 되게 하고, 쪽 밖으로 나가지 않게 붙인다. */
export function boxAtPoint(
  viewportWidth: number,
  viewportHeight: number,
  size: { width: number; height: number },
  pointX: number,
  pointY: number,
): PercentBox {
  const width = Math.min(size.width, Math.max(1, viewportWidth));
  const height = Math.min(size.height, Math.max(1, viewportHeight));
  const x = Math.min(Math.max(0, pointX - width / 2), Math.max(0, viewportWidth - width));
  const y = Math.min(Math.max(0, pointY - height / 2), Math.max(0, viewportHeight - height));
  return topLeftToPercentBox({ x, y, width, height }, viewportWidth, viewportHeight);
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

export function resizePercent(
  field: Pick<EditorField, 'posX' | 'posY' | 'width' | 'height'>,
  viewportWidth: number,
  viewportHeight: number,
  dw: number,
  dh: number,
): PercentBox {
  const current = percentBoxToTopLeft(field, viewportWidth, viewportHeight);
  const width = Math.min(Math.max(36, current.width + dw), viewportWidth - current.x);
  const height = Math.min(Math.max(20, current.height + dh), viewportHeight - current.y);
  return topLeftToPercentBox({ ...current, width, height }, viewportWidth, viewportHeight);
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

function blankField(
  pageNumber: number,
  box: PercentBox,
  extra: Pick<EditorField, 'type' | 'signerSlot'> & Partial<EditorField>,
): EditorField {
  return {
    id: newId(),
    pageNumber,
    ...box,
    required: false,
    imageFileKey: null,
    imageMime: null,
    imageUrl: null,
    textContent: null,
    fontSize: null,
    label: null,
    paramKey: null,
    inputType: null,
    dateFormat: null,
    ...extra,
  };
}

export function newSignatureField(pageNumber: number, page: PageSize, signerSlot = 1): EditorField {
  return blankField(pageNumber, centeredPercent(page.width, page.height, SIGNATURE_BOX_PX), {
    type: 'SIGNATURE',
    signerSlot,
  });
}

export function newSignatureFieldAt(
  pageNumber: number,
  page: PageSize,
  x: number,
  y: number,
  signerSlot = 1,
): EditorField {
  return blankField(pageNumber, boxAtPoint(page.width, page.height, SIGNATURE_BOX_PX, x, y), {
    type: 'SIGNATURE',
    signerSlot,
  });
}

/** 날짜칸은 종류가 아니다. 글자칸의 넣는 방법만 날짜다. */
export type TextInput = 'TEXT' | 'DATE';

export function newTextField(pageNumber: number, page: PageSize, inputType: TextInput = 'TEXT'): EditorField {
  return blankField(pageNumber, centeredPercent(page.width, page.height, TEXT_BOX_PX), {
    type: 'TEXT',
    signerSlot: 1,
    textContent: '',
    fontSize: DEFAULT_FONT_SIZE_PCT,
    inputType,
  });
}

export function newTextFieldAt(
  pageNumber: number,
  page: PageSize,
  x: number,
  y: number,
  inputType: TextInput = 'TEXT',
): EditorField {
  return blankField(pageNumber, boxAtPoint(page.width, page.height, TEXT_BOX_PX, x, y), {
    type: 'TEXT',
    signerSlot: 1,
    textContent: '',
    fontSize: DEFAULT_FONT_SIZE_PCT,
    inputType,
  });
}

/**
 * 계약서에는 그림이 칸 크기로 늘어나 찍힌다. 새 칸은 그림 비율대로 만들어 찌그러지지 않게 한다.
 * 비율을 모르면 정사각형이다.
 */
export function imageBoxSize(natural?: { width: number; height: number } | null): {
  width: number;
  height: number;
} {
  if (!natural || !(natural.width > 0) || !(natural.height > 0)) return IMAGE_BOX_PX;
  const side = Math.max(IMAGE_BOX_PX.width, IMAGE_BOX_PX.height);
  const ratio = natural.width / natural.height;
  return ratio >= 1 ? { width: side, height: side / ratio } : { width: side * ratio, height: side };
}

export function newImageField(
  pageNumber: number,
  page: PageSize,
  image: { imageFileKey: string; imageMime: string; imageUrl: string | null },
  at?: { x: number; y: number },
  natural?: { width: number; height: number } | null,
): EditorField {
  const size = imageBoxSize(natural);
  const box = at
    ? boxAtPoint(page.width, page.height, size, at.x, at.y)
    : centeredPercent(page.width, page.height, size);
  return blankField(pageNumber, box, { type: 'IMAGE', signerSlot: 1, ...image });
}
