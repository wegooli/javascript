import {
  DEFAULT_FONT_SIZE_PCT,
  fontSizeFromPercent,
  percentBoxToTopLeft,
  upperBoundTextWidth,
} from '@wegooli/paper-core';
import { describe, expect, it } from 'vitest';

import { IMAGE_BOX_PX, boxAtPoint, fittedBoxWidthPx, imageBoxSize, paddingOnScreen } from './placement';

describe('끌어다 놓은 자리', () => {
  it('떨어뜨린 점이 칸의 가운데가 되고 쪽 안에 붙는다', () => {
    const placed = percentBoxToTopLeft(boxAtPoint(500, 1000, { width: 160, height: 36 }, 100, 80), 500, 1000);
    expect(placed).toMatchObject({ x: 20, y: 62, width: 160, height: 36 });
    const pinned = percentBoxToTopLeft(boxAtPoint(500, 1000, { width: 160, height: 36 }, 10, 10), 500, 1000);
    expect(pinned.x).toBe(0);
    expect(pinned.y).toBe(0);
  });
});

describe('글자 폭', () => {
  it('잰 폭이 칸보다 넓으면 여백을 더한 너비로 늘린다', () => {
    const measure = (text: string) => (text.includes(' ') ? 10 : 100);
    const text = 'a b';
    const measured = upperBoundTextWidth(measure, text, fontSizeFromPercent(DEFAULT_FONT_SIZE_PCT, 1000));
    const pad = paddingOnScreen(500, 500);
    const next = fittedBoxWidthPx({
      measure,
      text,
      fontPercent: DEFAULT_FONT_SIZE_PCT,
      viewportWidth: 500,
      viewportHeight: 1000,
      pageWidth: 500,
      currentWidthPx: 50,
    });
    expect(next).toBe(measured + pad * 2);
    expect(next).toBeGreaterThan(50);
  });

  it('칸 안에 들어가면 너비를 바꾸지 않는다', () => {
    const measure = () => 10;
    expect(
      fittedBoxWidthPx({
        measure,
        text: '가',
        fontPercent: DEFAULT_FONT_SIZE_PCT,
        viewportWidth: 500,
        viewportHeight: 1000,
        pageWidth: 500,
        currentWidthPx: 160,
      }),
    ).toBe(160);
  });

  it('아무것도 재지 못하면 둔 너비를 유지한다', () => {
    expect(
      fittedBoxWidthPx({
        measure: () => 0,
        text: '월세',
        fontPercent: DEFAULT_FONT_SIZE_PCT,
        viewportWidth: 500,
        viewportHeight: 1000,
        pageWidth: 500,
        currentWidthPx: 160,
      }),
    ).toBe(160);
  });

  it('새 그림 칸은 그림 비율을 따르고, 모르면 정사각형이다', () => {
    expect(imageBoxSize(null)).toEqual(IMAGE_BOX_PX);
    expect(imageBoxSize({ width: 400, height: 200 })).toEqual({ width: 120, height: 60 });
    expect(imageBoxSize({ width: 100, height: 400 })).toEqual({ width: 30, height: 120 });
  });
});
