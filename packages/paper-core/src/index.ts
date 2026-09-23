/**
 * `@wegooli/paper-core` — 칸의 위치, 글자 폭, 이름표를 재는 자.
 *
 * 종이를 그리지 않고, 화면을 기억하지 않고, 서버에 말을 걸지 않는다.
 * 읽고 고치는 화면은 이 패키지가 아니다.
 */

export {
  DEFAULT_FONT_SIZE_PCT,
  TEXT_PADDING_PT,
  fontSizeFromPercent,
  fittedFontSize,
  maxTextWidth,
  percentBoxToPdfRect,
  percentBoxToTopLeft,
  pdfRectToPercentBox,
  textBaselineFromBoxBottom,
  topLeftToPercentBox,
} from './coords';
export type { PercentBox, PdfRect, TopLeftBox } from './coords';

export { SPACE_STAND_IN, upperBoundTextWidth } from './text-width';
export type { TextMeasurer } from './text-width';

export {
  MAX_PARAM_VALUE_LENGTH,
  PARAM_KEY_INPUT_REGEX,
  PARAM_KEY_STORAGE_REGEX,
  findDuplicateParamKeys,
  mergeOverridesById,
  normalizeParamKey,
  resolveParams,
  validateParamKey,
  validateParams,
} from './param-key';
export type { FieldOverride, MatchableField, MatchedEntry, ResolveResult } from './param-key';
