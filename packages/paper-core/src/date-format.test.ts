import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DATE_FORMAT,
  dateInputKind,
  formatDate,
  isoFromParts,
  parseIsoDate,
  validateDateFormat,
} from './date-format';

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

  it('모양에 맞춰 무엇을 물을지 고른다', () => {
    expect(dateInputKind(['YYYY'])).toBe('year');
    expect(dateInputKind(['M'])).toBe('month');
    expect(dateInputKind(['DD'])).toBe('day');
    expect(dateInputKind(['YYYY.MM'])).toBe('year-month');
    expect(dateInputKind(['YYYY년 M월 D일'])).toBe('date');
    expect(dateInputKind([null])).toBe('date');
    expect(dateInputKind(['M월 D일'])).toBe('month-day');
    // 「월만」과 「일만」을 한 날짜로 묶은 칸들
    expect(dateInputKind(['M', 'D'])).toBe('month-day');
    expect(dateInputKind(['YYYY', 'D'])).toBe('date');
    // 같은 날짜를 연·월·일 세 칸이 나눠 받으면 달력 하나
    expect(dateInputKind(['YYYY', 'M', 'D'])).toBe('date');
  });

  it('고른 부분만으로 값을 만들어도 모양대로 찍힌다', () => {
    expect(formatDate(isoFromParts({ year: 2026 }), 'YYYY')).toBe('2026');
    expect(formatDate(isoFromParts({ month: 3 }), 'M월')).toBe('3월');
    expect(formatDate(isoFromParts({ day: 31 }), 'D')).toBe('31');
    expect(formatDate(isoFromParts({ year: 2026, month: 12 }), 'YYYY.MM')).toBe('2026.12');
  });
});
