/**
 * 글자 폭의 상한.
 *
 * 재는 도구가 공백을 실제보다 좁게 말하면, 그 값을 믿고 줄인 글자가 칸을 넘는다.
 * 일반 공백(U+0020)만 전각 한 글자(가)로 바꿔 한 번 더 재고, 큰 쪽을 쓴다.
 * 다른 공백은 바꾸지 않는다. 공백을 덧붙여 자리를 맞추지 않는다.
 *
 * 재는 도구는 밖에서 넣는다. 이 패키지는 폰트를 들고 있지 않다.
 * size 의 단위는 그 도구의 단위와 같아야 한다.
 */

/** 공백 대신 넣어 재는 전각 글자. 부르는 쪽이 다른 글자로 바꿀 수 없다. */
export const SPACE_STAND_IN = '가';

export type TextMeasurer = (text: string, size: number) => number;

export function upperBoundTextWidth(
  measure: TextMeasurer,
  text: string,
  size: number,
): number {
  const asIs = measure(text, size);
  if (!text.includes(' ')) return asIs;
  const upperBound = measure(text.replace(/ /g, SPACE_STAND_IN), size);
  return Math.max(asIs, upperBound);
}
