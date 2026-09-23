import { DEFAULT_FONT_SIZE_PCT, fontSizeFromPercent, upperBoundTextWidth } from '@wegooli/paper-core';
import { describe, expect, it } from 'vitest';

import { fittedBoxWidthPx, paddingOnScreen } from './placement';

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
});
