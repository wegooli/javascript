import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_FONT_SIZE_PCT,
  MAX_PARAM_VALUE_LENGTH,
  SPACE_STAND_IN,
  TEXT_PADDING_PT,
  findDuplicateParamKeys,
  fittedFontSize,
  fontSizeFromPercent,
  maxTextWidth,
  mergeOverridesById,
  normalizeParamKey,
  percentBoxToPdfRect,
  percentBoxToTopLeft,
  pdfRectToPercentBox,
  resolveParams,
  textBaselineFromBoxBottom,
  topLeftToPercentBox,
  upperBoundTextWidth,
  validateParamKey,
  validateParams,
} from './index';
import * as api from './index';

const box = { posX: 10, posY: 20, width: 30, height: 10 };
const page = { width: 1000, height: 2000 };

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

describe('좌표', () => {
  it('1. PDF 세로 위치는 페이지 높이에서 위로부터의 거리와 칸 높이를 뺀다', () => {
    expect(percentBoxToPdfRect(box, page.width, page.height)).toEqual({
      x: 100,
      y: 1400,
      width: 300,
      height: 200,
    });
  });

  it('2. PDF 칸을 퍼센트로 되돌리면 같은 네 수가 된다', () => {
    const rect = percentBoxToPdfRect(box, page.width, page.height);
    expect(pdfRectToPercentBox(rect, page.width, page.height)).toEqual(box);
  });

  it('3. 화면 칸은 위를 0으로 두고, 세로를 뒤집지 않는다', () => {
    expect(percentBoxToTopLeft(box, 500, 1000)).toEqual({
      x: 50,
      y: 200,
      width: 150,
      height: 100,
    });
  });

  it('4. 화면 칸을 퍼센트로 되돌리면 같은 네 수가 된다', () => {
    const topLeft = percentBoxToTopLeft(box, 500, 1000);
    expect(topLeftToPercentBox(topLeft, 500, 1000)).toEqual(box);
  });

  it('5. 0에서 100 밖의 퍼센트도 잘라 넣지 않는다', () => {
    const outside = { posX: -5, posY: 110, width: 150, height: 10 };
    const rect = percentBoxToPdfRect(outside, 1000, 1000);
    const back = pdfRectToPercentBox(rect, 1000, 1000);
    // 110/100 은 이진수로 무한소수라 왕복이 1ulp 어긋난다. 자른 값은 100 이다.
    expect(back.posX).toBe(outside.posX);
    expect(back.width).toBe(outside.width);
    expect(back.height).toBe(outside.height);
    expect(back.posY).toBeGreaterThan(100);
    expect(back.posY).toBeCloseTo(110, 10);
  });

  it('6. 페이지 높이가 0이어도 던지지 않고 식 그대로 계산한다', () => {
    expect(() => percentBoxToPdfRect(box, page.width, 0)).not.toThrow();
    expect(percentBoxToPdfRect(box, page.width, 0)).toEqual({
      x: 100,
      y: 0,
      width: 300,
      height: 0,
    });
    expect(() => pdfRectToPercentBox({ x: 0, y: 0, width: 0, height: 0 }, page.width, 0)).not.toThrow();
  });

  it('7. A4 높이에서 기본 글자 크기는 14다', () => {
    expect(DEFAULT_FONT_SIZE_PCT).toBe((14 / 841.89) * 100);
    expect(fontSizeFromPercent(DEFAULT_FONT_SIZE_PCT, 841.89)).toBe(14);
  });

  it('8. 글자의 기준선은 칸의 아래쪽에 칸 높이와 글자 크기 차의 절반을 더한다', () => {
    expect(textBaselineFromBoxBottom(1400, 200, 14)).toBe(1493);
  });

  it('9. 글자가 들어갈 폭은 칸 폭에서 좌우 여백 2pt 씩을 뺀다', () => {
    expect(TEXT_PADDING_PT).toBe(2);
    expect(maxTextWidth(100)).toBe(96);
    expect(maxTextWidth(100, 3)).toBe(94);
  });

  it('10. 칸보다 넓은 글자만 비율대로 줄이고, 바닥도 0으로 나누기도 없다', () => {
    expect(fittedFontSize(14, 80, 100)).toBe(14);
    expect(fittedFontSize(14, 100.2, 80)).toBe((14 * 80) / 100.2);
    expect(fittedFontSize(14, 200, 80)).toBe(5.6);
    expect(fittedFontSize(14, 200, 80)).toBeLessThan(8);
    expect(fittedFontSize(14, 0, 80)).toBe(14);
    expect(fittedFontSize(14, -1, 80)).toBe(14);
  });
});

describe('글자 폭', () => {
  it('11. 공백이 있으면 그대로 잰 값과 전각으로 바꾼 값 중 큰 쪽을 쓴다', () => {
    const measure = (text: string) => (text.includes(' ') ? 80 : 100.2);
    expect(upperBoundTextWidth(measure, '3층 창가 선호', 12)).toBe(100.2);
  });

  it('12. 일반 공백이 없으면 한 번만 잰다', () => {
    const measure = vi.fn(() => 80);
    expect(upperBoundTextWidth(measure, 'abc', 12)).toBe(80);
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('13. 두 번째 측정은 일반 공백만 가로 바꾼다', () => {
    const calls: string[] = [];
    const measure = (text: string, size: number) => {
      calls.push(`${size}:${text}`);
      return text.length;
    };
    upperBoundTextWidth(measure, 'a  b\u00A0c', 12);
    expect(SPACE_STAND_IN).toBe('가');
    expect(calls).toEqual(['12:a  b\u00A0c', '12:a가가b\u00A0c']);
  });

  it('14. 전각으로 바꾼 값이 더 작아도 큰 쪽을 쓴다', () => {
    const measure = (text: string) => (text.includes(' ') ? 50 : 10);
    expect(upperBoundTextWidth(measure, 'a b', 12)).toBe(50);
  });
});

describe('이름표', () => {
  it('16. 낙타 표기, 하이픈, 연속 대문자, 연속 밑줄을 저장형으로 바꾼다', () => {
    expect(normalizeParamKey('senderName')).toBe('sender_name');
    expect(normalizeParamKey('SenderName')).toBe('sender_name');
    expect(normalizeParamKey('sender_name')).toBe('sender_name');
    expect(normalizeParamKey('car-Number')).toBe('car-number');
    expect(normalizeParamKey('carNumberV2')).toBe('car_number_v2');
    expect(normalizeParamKey('ABCDef')).toBe('a_b_c_def');
    expect(normalizeParamKey('a__b')).toBe('a_b');
    expect(normalizeParamKey('A')).toBe('a');
  });

  it('17. 형식은 영문 시작 64자까지이고, 거절 문구는 고정이다', () => {
    expect(validateParamKey('sender_name')).toEqual({ ok: true });
    expect(validateParamKey('senderName')).toEqual({ ok: true });
    expect(validateParamKey('')).toEqual({ ok: false, error: 'paramKey가 비어있습니다' });
    expect(validateParamKey('Sender Name')).toEqual({
      ok: false,
      error: 'paramKey 형식 오류 (영문 시작, 영숫자/언더스코어/하이픈, 64자 이하): Sender Name',
    });
    expect(validateParamKey('1sender').ok).toBe(false);
    const ok64 = `a${'b'.repeat(63)}`;
    const bad65 = `a${'b'.repeat(64)}`;
    expect(ok64).toHaveLength(64);
    expect(bad65).toHaveLength(65);
    expect(validateParamKey(ok64).ok).toBe(true);
    expect(validateParamKey(bad65).ok).toBe(false);
  });

  it('18. 객체가 아닌 요청은 빈 맵으로 통과한다', () => {
    expect(validateParams(null)).toEqual({ ok: true, cleaned: {} });
    expect(validateParams(undefined)).toEqual({ ok: true, cleaned: {} });
    expect(validateParams(['a'])).toEqual({ ok: true, cleaned: {} });
    expect(validateParams('nope')).toEqual({ ok: true, cleaned: {} });
  });

  it('19. 빈 값은 건너뛰고, 문자열이 아니면 그 문구로 거절한다', () => {
    const raw = { empty_val: '   ', valid_key: 'hello', '  ': 'ignored' };
    expect(validateParams(raw)).toEqual({ ok: true, cleaned: { valid_key: 'hello' } });
    expect(raw.empty_val).toBe('   ');
    expect(validateParams({ num_key: 123 })).toEqual({
      ok: false,
      error: 'params 값은 문자열이어야 합니다: num_key',
    });
  });

  it('20. 길이는 자모를 합친 뒤에 세고, 2000자를 넘으면 거절한다', () => {
    const decomposed = '한'.repeat(1000).normalize('NFD');
    expect(decomposed.length).toBeGreaterThan(MAX_PARAM_VALUE_LENGTH);
    const accepted = validateParams({ tenant_name: decomposed });
    expect(accepted).toEqual({
      ok: true,
      cleaned: { tenant_name: '한'.repeat(1000) },
    });

    const tooLong = validateParams({ a: '한'.repeat(2001) });
    expect(tooLong).toEqual({ ok: false, error: 'params 값이 2000자를 초과: a' });
  });

  it('21. 한 요청 안에서 같은 이름으로 모이면 충돌이고, 하나만 있으면 저장형으로 둔다', () => {
    expect(validateParams({ senderName: '홍길동', sender_name: 'x' })).toEqual({
      ok: false,
      error: '정규화 후 paramKey 중복: sender_name',
    });
    expect(validateParams({ senderName: '홍길동' })).toEqual({
      ok: true,
      cleaned: { sender_name: '홍길동' },
    });
  });

  it('22. 긴 값은 이름 형식보다 먼저 거절한다', () => {
    const result = validateParams({ '1bad': 'x'.repeat(2001) });
    expect(result).toEqual({ ok: false, error: 'params 값이 2000자를 초과: 1bad' });
  });

  it('23. 요청 객체와 합치는 배열은 그대로 둔다', () => {
    const raw = { senderName: '홍길동' };
    validateParams(raw);
    expect(raw).toEqual({ senderName: '홍길동' });

    const primary = [{ id: 'A', textContent: 'P' }];
    const secondary = [
      { id: 'A', textContent: 'S' },
      { id: 'B', imageFileKey: 'k' },
    ];
    mergeOverridesById(primary, secondary);
    expect(primary).toEqual([{ id: 'A', textContent: 'P' }]);
    expect(secondary).toEqual([
      { id: 'A', textContent: 'S' },
      { id: 'B', imageFileKey: 'k' },
    ]);
  });

  it('24. TEXT 칸만, 저장된 이름 그대로, 칸 순서대로 맞추고 없는 이름은 목록에 남긴다', () => {
    const many = resolveParams(
      [
        { id: 'f1', type: 'TEXT', paramKey: 'contract_date' },
        { id: 'f2', type: 'TEXT', paramKey: 'contract_date' },
        { id: 'f3', type: 'IMAGE', paramKey: 'contract_date' },
      ],
      { contract_date: '2026-05-15' },
    );
    expect(many.overrides).toEqual([
      { id: 'f1', textContent: '2026-05-15' },
      { id: 'f2', textContent: '2026-05-15' },
    ]);
    expect(many.matched).toEqual([
      { fieldId: 'f1', paramKey: 'contract_date', length: 10 },
      { fieldId: 'f2', paramKey: 'contract_date', length: 10 },
    ]);
    expect(many.unknown).toEqual([]);

    const camelStored = resolveParams(
      [{ id: 'f1', type: 'TEXT', paramKey: 'senderName' }],
      { sender_name: '홍길동' },
    );
    expect(camelStored.overrides).toEqual([]);
    expect(camelStored.unknown).toEqual(['sender_name']);

    const partial = resolveParams([{ id: 'f1', type: 'TEXT', paramKey: 'sender_name' }], {
      unknown_key: '값',
      sender_name: '홍길동',
    });
    expect(partial.overrides).toEqual([{ id: 'f1', textContent: '홍길동' }]);
    expect(partial.unknown).toEqual(['unknown_key']);

    const none = resolveParams([{ id: 'f1', type: 'SIGNATURE', paramKey: null }], { no_match: '값' });
    expect(none.overrides).toEqual([]);
    expect(none.unknown).toEqual(['no_match']);
  });

  it('25. 칸 이름이 겹치면 알려 주되, 그 둘은 같은 값을 받는다', () => {
    expect(findDuplicateParamKeys(['senderName', 'sender_name'])).toEqual(['sender_name']);
    expect(findDuplicateParamKeys([null, undefined, '  ', 'Sender Name', 'ok_key'])).toEqual([]);
    expect(findDuplicateParamKeys(['1bad', '1bad'])).toEqual([]);

    const resolved = resolveParams(
      [
        { id: 'a', type: 'TEXT', paramKey: 'tenant_name' },
        { id: 'b', type: 'TEXT', paramKey: 'tenant_name' },
      ],
      { tenant_name: '박서연' },
    );
    expect(resolved.overrides.map((item) => item.textContent)).toEqual(['박서연', '박서연']);
    expect(resolved.unknown).toEqual([]);
  });

  it('26. 같은 id 는 앞의 값을 남기고, 새 id 는 뒤에 붙인다', () => {
    const merged = mergeOverridesById(
      [{ id: 'A', textContent: 'P' }],
      [
        { id: 'A', textContent: 'S' },
        { id: 'B', imageFileKey: 'k' },
      ],
    );
    expect(merged).toEqual([
      { id: 'A', textContent: 'P' },
      { id: 'B', imageFileKey: 'k' },
    ]);
  });
});

describe('패키지 경계', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  function filesUnder(dir: string): string[] {
    const found: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) found.push(...filesUnder(full));
      else found.push(full);
    }
    return found;
  }

  it('15. 폰트도 PDF 라이브러리도 화면 라이브러리도 없다', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };
    const forbidden = [
      ['pdf', 'lib'].join('-'),
      ['@pdf-', 'lib/fontkit'].join(''),
      ['rea', 'ct'].join(''),
      ['rea', 'ct-dom'].join(''),
    ];
    for (const name of forbidden) {
      expect(pkg.dependencies ?? {}).not.toHaveProperty(name);
      expect(pkg.peerDependencies ?? {}).not.toHaveProperty(name);
      expect(pkg.optionalDependencies ?? {}).not.toHaveProperty(name);
    }
    expect(pkg.dependencies ?? {}).toEqual({});

    const sources = filesUnder(path.join(root, 'src')).map((file) => fs.readFileSync(file, 'utf8'));
    const joined = sources.join('\n');
    for (const name of forbidden) {
      expect(joined.includes(name)).toBe(false);
    }

    const fonts = filesUnder(root).filter((file) => /\.(ttf|otf|woff2?)$/i.test(file));
    expect(fonts).toEqual([]);
  });

  it('27. 미리 박아 둔 이름표 목록이나 거절 문장을 내보내지 않는다', () => {
    const keys = Object.keys(api).filter((key) => !key.startsWith('_')).sort();
    expect(keys).toEqual(
      [
        'DEFAULT_FONT_SIZE_PCT',
        'MAX_PARAM_VALUE_LENGTH',
        'PARAM_KEY_INPUT_REGEX',
        'PARAM_KEY_STORAGE_REGEX',
        'SPACE_STAND_IN',
        'TEXT_PADDING_PT',
        'findDuplicateParamKeys',
        'fittedFontSize',
        'fontSizeFromPercent',
        'maxTextWidth',
        'mergeOverridesById',
        'normalizeParamKey',
        'pdfRectToPercentBox',
        'percentBoxToPdfRect',
        'percentBoxToTopLeft',
        'resolveParams',
        'textBaselineFromBoxBottom',
        'topLeftToPercentBox',
        'upperBoundTextWidth',
        'validateParamKey',
        'validateParams',
      ].sort(),
    );

    const sources = filesUnder(path.join(root, 'src')).map((file) => fs.readFileSync(file, 'utf8'));
    const joined = sources.join('\n');
    const httpWord = ['HT', 'TP'].join('');
    const unknownPhrase = ['Unknown', 'paramKey'].join(' ');
    expect(joined.includes(httpWord)).toBe(false);
    expect(joined.includes(unknownPhrase)).toBe(false);
    expect(joined).not.toMatch(/status\s*[:=]\s*\d{3}/);
  });

  it('좌표와 폭과 이름표를 한 번에 이어서 쓸 수 있다', () => {
    const rect = percentBoxToPdfRect(box, page.width, page.height);
    const room = maxTextWidth(rect.width);
    const textWidth = upperBoundTextWidth((text) => (text.includes(' ') ? 400 : 500), 'a b', 14);
    const size = fittedFontSize(14, textWidth, room);
    const baseline = textBaselineFromBoxBottom(rect.y, rect.height, size);

    expect(rect).toEqual({ x: 100, y: 1400, width: 300, height: 200 });
    expect(room).toBe(296);
    expect(textWidth).toBe(500);
    expect(size).toBe((14 * 296) / 500);
    expect(baseline).toBe(rect.y + (rect.height - size) / 2);

    const checked = validateParams({ senderName: '홍길동', unknown_key: '값' });
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const resolved = resolveParams(
      [
        { id: 'f1', type: 'TEXT', paramKey: 'sender_name' },
        { id: 'img', type: 'IMAGE', paramKey: 'sender_name' },
      ],
      checked.cleaned,
    );
    expect(resolved.unknown).toEqual(['unknown_key']);
    expect(
      mergeOverridesById(resolved.overrides, [
        { id: 'f1', textContent: '덮이면 안 됨' },
        { id: 'extra', textContent: '추가' },
      ]),
    ).toEqual([
      { id: 'f1', textContent: '홍길동' },
      { id: 'extra', textContent: '추가' },
    ]);
  });
});
