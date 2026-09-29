/**
 * 날짜칸의 모양. 보내는 쪽은 `2026-10-01`로 값을 주고, 계약서에는 이 모양대로 찍는다.
 *
 * 「20__년 __월 __일」처럼 칸이 나뉜 양식은 칸마다 `YYYY`, `M`, `D`만 적는다.
 * 편집기 미리보기와 서버가 같은 식을 쓰도록 여기에만 둔다.
 */

/** 모양을 적지 않은 날짜칸. 예전부터 찍히던 모양이다. */
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

export const MAX_DATE_FORMAT_LENGTH = 40;

/** 긴 것부터 맞춘다. `YYYY`를 `YY` 둘로 읽지 않게. */
const TOKENS = ['YYYY', 'YY', 'MM', 'M', 'DD', 'D'] as const;
type Token = (typeof TOKENS)[number];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

type DatePart = { year: number; month: number; day: number };

/** `2026-10-01`만 날짜로 본다. 달력에 없는 날(2월 30일)은 날짜가 아니다. */
export function parseIsoDate(value: string): DatePart | null {
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function tokenValue(token: Token, date: DatePart): string {
  switch (token) {
    case 'YYYY':
      return String(date.year).padStart(4, '0');
    case 'YY':
      return String(date.year % 100).padStart(2, '0');
    case 'MM':
      return String(date.month).padStart(2, '0');
    case 'M':
      return String(date.month);
    case 'DD':
      return String(date.day).padStart(2, '0');
    case 'D':
      return String(date.day);
  }
}

function tokenAt(pattern: string, index: number): Token | null {
  for (const token of TOKENS) {
    if (pattern.startsWith(token, index)) return token;
  }
  return null;
}

/**
 * `2026-10-01`을 모양대로 바꾼다. `YYYY년 M월 D일` → `2026년 10월 1일`.
 *
 * 날짜가 아닌 값은 **바꾸지 않고 그대로** 돌려준다. 외부 연동이 이미 모양을 갖춰
 * 보낸 글자를 망가뜨리지 않기 위해서다. 모양이 비었으면 기본 모양을 쓴다.
 */
export function formatDate(value: string, pattern?: string | null): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  const shape = pattern?.trim() ? pattern : DEFAULT_DATE_FORMAT;
  let out = '';
  let index = 0;
  while (index < shape.length) {
    const token = tokenAt(shape, index);
    if (token) {
      out += tokenValue(token, date);
      index += token.length;
    } else {
      out += shape[index];
      index += 1;
    }
  }
  return out;
}

export type DateFormatCheck =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'too_long' | 'no_token' };

/** 저장해도 되는 모양인가. 연·월·일 중 하나는 들어 있어야 한다. */
export function validateDateFormat(pattern: string): DateFormatCheck {
  if (pattern.trim() === '') return { ok: false, reason: 'empty' };
  if (pattern.length > MAX_DATE_FORMAT_LENGTH) return { ok: false, reason: 'too_long' };
  for (let index = 0; index < pattern.length; index += 1) {
    if (tokenAt(pattern, index)) return { ok: true };
  }
  return { ok: false, reason: 'no_token' };
}
