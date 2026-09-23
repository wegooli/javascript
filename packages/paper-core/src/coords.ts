/**
 * 화면의 칸과 PDF 의 칸을 같은 식으로 바꾼다.
 *
 * 저장값과 화면은 왼쪽 위가 0 이다. PDF 는 왼쪽 아래가 0 이다.
 * 세로를 뒤집는 곳은 PDF 로 갈 때 하나뿐이다.
 *   pdfY = pageHeight - browserTopY - drawHeight
 * 화면 위에 칸을 올릴 때는 뒤집지 않는다. 두 번 뒤집히면 칸이 점프한다.
 *
 * 퍼센트가 0–100 밖이어도 잘라 넣지 않는다. 자르면 저장된 칸이 달라진다.
 */

/** 14pt 를 A4 세로(841.89pt) 높이의 퍼센트로 둔 값. 쓰는 쪽이 모두 이 숫자를 공유한다. */
export const DEFAULT_FONT_SIZE_PCT = (14 / 841.89) * 100;

/** 글자 칸의 좌우 여백. 단위는 PDF pt. */
export const TEXT_PADDING_PT = 2;

export interface PercentBox {
  /** 왼쪽에서부터, 너비의 퍼센트 */
  posX: number;
  /** 위에서부터, 높이의 퍼센트. 아래가 아니다. */
  posY: number;
  width: number;
  height: number;
}

export interface PdfRect {
  x: number;
  /** 페이지 아래에서부터 */
  y: number;
  width: number;
  height: number;
}

export interface TopLeftBox {
  x: number;
  /** 위에서부터. 화면 칸과 같은 방향이다. */
  y: number;
  width: number;
  height: number;
}

export function percentBoxToPdfRect(
  box: PercentBox,
  pageWidth: number,
  pageHeight: number,
): PdfRect {
  const width = (box.width / 100) * pageWidth;
  const height = (box.height / 100) * pageHeight;
  const browserTopY = (box.posY / 100) * pageHeight;
  const x = (box.posX / 100) * pageWidth;
  const y = pageHeight - browserTopY - height;
  return { x, y, width, height };
}

export function pdfRectToPercentBox(
  rect: PdfRect,
  pageWidth: number,
  pageHeight: number,
): PercentBox {
  const browserTopY = pageHeight - rect.y - rect.height;
  return {
    posX: (rect.x / pageWidth) * 100,
    posY: (browserTopY / pageHeight) * 100,
    width: (rect.width / pageWidth) * 100,
    height: (rect.height / pageHeight) * 100,
  };
}

export function percentBoxToTopLeft(
  box: PercentBox,
  viewportWidth: number,
  viewportHeight: number,
): TopLeftBox {
  return {
    x: (box.posX / 100) * viewportWidth,
    y: (box.posY / 100) * viewportHeight,
    width: (box.width / 100) * viewportWidth,
    height: (box.height / 100) * viewportHeight,
  };
}

export function topLeftToPercentBox(
  box: TopLeftBox,
  viewportWidth: number,
  viewportHeight: number,
): PercentBox {
  return {
    posX: (box.x / viewportWidth) * 100,
    posY: (box.y / viewportHeight) * 100,
    width: (box.width / viewportWidth) * 100,
    height: (box.height / viewportHeight) * 100,
  };
}

export function fontSizeFromPercent(fontPercent: number, pageHeight: number): number {
  return (fontPercent / 100) * pageHeight;
}

/** 칸 안에서 글자의 세로 가운데. pdfY 는 칸의 아래쪽이다. */
export function textBaselineFromBoxBottom(
  pdfY: number,
  drawHeight: number,
  fontSize: number,
): number {
  return pdfY + (drawHeight - fontSize) / 2;
}

export function maxTextWidth(
  drawWidth: number,
  paddingEachSide: number = TEXT_PADDING_PT,
): number {
  return drawWidth - paddingEachSide * 2;
}

/**
 * 글자가 칸보다 넓으면 그 비율만큼만 줄인다.
 * 최소 크기는 두지 않는다. 바닥에 걸리면 글자가 다시 칸 밖으로 나가 아랫줄을 덮는다.
 * 잰 폭이 0 이하면 나누지 않고 요청한 크기를 그대로 돌려준다.
 */
export function fittedFontSize(
  naturalSize: number,
  textWidth: number,
  maxWidth: number,
): number {
  if (!(textWidth > 0) || textWidth <= maxWidth) return naturalSize;
  return (naturalSize * maxWidth) / textWidth;
}
