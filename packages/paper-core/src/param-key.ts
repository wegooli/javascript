/**
 * 이름표(paramKey)의 형식, 저장용 소문자, 한 요청 안의 중복.
 *
 * 양식에 없는 이름표는 목록으로 돌려준다. 그것을 거절할지는 부르는 쪽이 정한다.
 * 칸 두 개가 같은 이름인 것은 오류가 아니다. 그 칸들은 같은 값을 받는다.
 * 한 요청에 senderName 과 sender_name 이 같이 있으면 그건 충돌이다.
 */

/** 입력으로 허용하는 이름. 영문 시작, 영숫자·밑줄·하이픈, 64자 이하. 낙타 표기와 뱀 표기 모두 된다. */
export const PARAM_KEY_INPUT_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

/** 저장하고 맞출 때 쓰는 이름. 소문자로 시작한다. */
export const PARAM_KEY_STORAGE_REGEX = /^[a-z][a-z0-9_-]{0,63}$/;

/** 이름표에 실어 보내는 값의 최대 글자 수. 한글은 자모를 합친 뒤의 수로 센다. */
export const MAX_PARAM_VALUE_LENGTH = 2000;

export interface FieldOverride {
  id: string;
  textContent?: string | null;
  imageFileKey?: string | null;
  imageMime?: string | null;
}

export interface MatchableField {
  id: string;
  type: 'SIGNATURE' | 'IMAGE' | 'TEXT';
  /** TEXT 칸에서만 의미가 있다. 저장된 값은 이미 소문자 정규형이어야 맞는다. */
  paramKey: string | null;
}

export interface MatchedEntry {
  fieldId: string;
  paramKey: string;
  /** textContent 의 글자 수 */
  length: number;
}

export interface ResolveResult {
  overrides: FieldOverride[];
  matched: MatchedEntry[];
  /** 어느 칸과도 맞지 않은 이름. 거절은 하지 않는다. */
  unknown: string[];
}

/**
 * 외부에서 온 이름을 저장용 소문자로 바꾼다.
 *
 * senderName → sender_name, SenderName → sender_name.
 * 하이픈·밑줄 바로 뒤의 대문자에는 밑줄을 넣지 않는다. car-Number → car-number.
 * 연속 대문자는 글자마다 가른다. ABCDef → a_b_c_def.
 * 연속 밑줄은 하나로 줄인다.
 * 결과가 저장 형식이 아니면 던진다. 형식에 맞는 입력에서는 일어나지 않는다.
 */
export function normalizeParamKey(input: string): string {
  const result = input
    .replace(/(?<![_-])([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
    .replace(/_+/g, '_');

  if (!PARAM_KEY_STORAGE_REGEX.test(result)) {
    throw new Error(
      `normalizeParamKey 결과가 저장 형식을 만족하지 못합니다: "${input}" → "${result}"`,
    );
  }

  return result;
}

/** 이름표의 형식만 본다. 값의 길이에는 관여하지 않는다. */
export function validateParamKey(key: string): { ok: true } | { ok: false; error: string } {
  if (!key || key.trim() === '') {
    return { ok: false, error: 'paramKey가 비어있습니다' };
  }
  if (!PARAM_KEY_INPUT_REGEX.test(key)) {
    return {
      ok: false,
      error: `paramKey 형식 오류 (영문 시작, 영숫자/언더스코어/하이픈, 64자 이하): ${key}`,
    };
  }
  return { ok: true };
}

/**
 * 한 요청의 이름표 묶음을 검사하고, 저장용 이름으로 모은 문자열 맵을 돌려준다.
 *
 * 비어 있는 키와, 앞뒤를 자른 뒤 비어 있는 값은 건너뛴다.
 * 문자열이 아니면 실패한다.
 * 길이는 자모를 합치고 앞뒤를 자른 뒤로 센다. 형식 검사보다 먼저다.
 * 정규화한 이름이 겹치면 실패한다.
 * 객체·배열이 아닌 값은 빈 맵으로 통과시킨다.
 */
export function validateParams(
  raw: unknown,
): { ok: true; cleaned: Record<string, string> } | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: true, cleaned: {} };
  }

  const cleaned: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(raw)) {
    const key = rawKey.trim();
    if (key === '') continue;

    if (typeof rawValue !== 'string') {
      return { ok: false, error: `params 값은 문자열이어야 합니다: ${key}` };
    }

    const value = rawValue.normalize('NFC').trim();
    if (value === '') continue;

    if (value.length > MAX_PARAM_VALUE_LENGTH) {
      return {
        ok: false,
        error: `params 값이 ${MAX_PARAM_VALUE_LENGTH}자를 초과: ${key}`,
      };
    }

    const keyResult = validateParamKey(key);
    if (!keyResult.ok) {
      return { ok: false, error: keyResult.error };
    }

    const normalizedKey = normalizeParamKey(key);
    if (normalizedKey in cleaned) {
      return {
        ok: false,
        error: `정규화 후 paramKey 중복: ${normalizedKey}`,
      };
    }

    cleaned[normalizedKey] = value;
  }

  return { ok: true, cleaned };
}

/**
 * 정리된 값과 TEXT 칸을 정확히 같은 이름으로 맞춘다.
 * 칸에 저장된 이름은 다시 정규화하지 않는다. 이미지·서명 칸은 건너뛴다.
 * 한 이름이 칸 여러 개와 맞으면 그 칸 모두에 같은 값을 넣는다.
 * 맞는 칸이 없는 이름은 unknown 에 넣고, 던지지 않는다.
 * 순서는 값 맵의 키 순서이고, 같은 키 안에서는 칸 배열의 순서를 유지한다.
 */
export function resolveParams(
  fields: MatchableField[],
  cleaned: Record<string, string>,
): ResolveResult {
  const overrides: FieldOverride[] = [];
  const matched: MatchedEntry[] = [];
  const unknown: string[] = [];

  for (const [key, value] of Object.entries(cleaned)) {
    const matchedFields = fields.filter((field) => field.type === 'TEXT' && field.paramKey === key);

    if (matchedFields.length === 0) {
      unknown.push(key);
    } else {
      for (const field of matchedFields) {
        overrides.push({ id: field.id, textContent: value });
        matched.push({ fieldId: field.id, paramKey: key, length: value.length });
      }
    }
  }

  return { overrides, matched, unknown };
}

/**
 * 같은 id 는 primary 만 남긴다. secondary 의 그 id 는 통째로 버린다.
 * id 가 다른 secondary 항목은 뒤에 붙인다. 두 입력 배열은 바꾸지 않는다.
 */
export function mergeOverridesById(
  primary: FieldOverride[],
  secondary: FieldOverride[],
): FieldOverride[] {
  const primaryIds = new Set(primary.map((item) => item.id));
  return [...primary, ...secondary.filter((item) => !primaryIds.has(item.id))];
}

/**
 * 칸들에 적힌 이름 중, 정규화하면 두 번 이상 나오는 이름을 돌려준다.
 * 이건 경고용이다. 저장을 막지 않는다. 두 칸은 같은 값을 받는다.
 * 형식이 안 되는 이름, 빈 값, null 은 건너뛴다. 그래서 정규화가 던지지 않는다.
 */
export function findDuplicateParamKeys(keys: ReadonlyArray<string | null | undefined>): string[] {
  const counts = new Map<string, number>();
  const order: string[] = [];

  for (const raw of keys) {
    if (raw == null) continue;
    const key = raw.trim();
    if (key === '') continue;
    if (!validateParamKey(key).ok) continue;

    const normalized = normalizeParamKey(key);
    const seen = counts.get(normalized) ?? 0;
    if (seen === 0) order.push(normalized);
    counts.set(normalized, seen + 1);
  }

  return order.filter((key) => (counts.get(key) ?? 0) >= 2);
}
