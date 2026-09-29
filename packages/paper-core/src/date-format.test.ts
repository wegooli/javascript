import { describe, expect, it } from 'vitest';

import { DEFAULT_DATE_FORMAT, formatDate, parseIsoDate, validateDateFormat } from './date-format';

describe('날짜 모양', () => {
  it('모양을 안 적으면 예전처럼 2026-10-01이다', () => {
    expect(formatDate('2026-10-01')).toBe('2026-10-01');
    expect(formatDate('2026-10-01', '')).toBe('2026-10-01');
    expect(formatDate('2026-10-01', DEFAULT_DATE_FORMAT)).toBe('2026-10-01');
  });

  it('한국식 모양과, 칸이 나뉜 양식의 연·월·일', () => {
    expect(formatDate('2026-01-05', 'YYYY년 M월 D일')).toBe('2026년 1월 5일');
    expect(formatDate('2026-01-05', 'YYYY. MM. DD.')).toBe('2026. 01. 05.');
    expect(formatDate('2026-01-05', 'YYYY')).toBe('2026');
    expect(formatDate('2026-01-05', 'M')).toBe('1');
    expect(formatDate('2026-01-05', 'DD')).toBe('05');
    expect(formatDate('2026-01-05', 'YY.MM')).toBe('26.01');
  });

  it('YYYY를 YY 둘로 읽지 않는다', () => {
    expect(formatDate('2026-10-01', 'YYYYYY')).toBe('202626');
  });

  it('날짜가 아닌 값은 그대로 둔다', () => {
    expect(formatDate('2026년 10월 1일', 'YYYY')).toBe('2026년 10월 1일');
    expect(formatDate('', 'YYYY')).toBe('');
    expect(formatDate('2026-02-30', 'YYYY')).toBe('2026-02-30');
  });

  it('달력에 있는 날만 날짜다', () => {
    expect(parseIsoDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseIsoDate('2026-02-29')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
  });

  it('연·월·일 중 하나는 있어야 저장한다', () => {
    expect(validateDateFormat('YYYY년')).toEqual({ ok: true });
    expect(validateDateFormat('  ')).toEqual({ ok: false, reason: 'empty' });
    expect(validateDateFormat('년 월 일')).toEqual({ ok: false, reason: 'no_token' });
    expect(validateDateFormat('Y'.repeat(41))).toEqual({ ok: false, reason: 'too_long' });
  });
});
