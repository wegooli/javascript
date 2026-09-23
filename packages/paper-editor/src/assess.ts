import { findDuplicateParamKeys, normalizeParamKey, validateParamKey } from '@wegooli/paper-core';

import type { EditorField } from './types';

export type SaveAssessment =
  | { ok: true; duplicates: string[]; unknownKeys: [] }
  | { ok: false; reason: 'ghost'; ghostCount: number; duplicates: string[] }
  | { ok: false; reason: 'invalid'; fieldId: string; duplicates: string[] }
  | { ok: false; reason: 'confirm'; unknownKeys: string[]; duplicates: string[] }
  | { ok: false; reason: 'catalog'; duplicates: string[] };

function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function isGhost(field: EditorField): boolean {
  if (field.type !== 'TEXT') return false;
  return trimmed(field.textContent) === '' && trimmed(field.paramKey) === '';
}

function normalizedKey(field: EditorField): string {
  if (field.type !== 'TEXT') return '';
  return trimmed(field.paramKey);
}

function knownKeys(catalog: readonly string[]): Set<string> {
  const known = new Set<string>();
  for (const raw of catalog) {
    const key = raw.trim();
    if (!key) continue;
    known.add(validateParamKey(key).ok ? normalizeParamKey(key) : key);
  }
  return known;
}

/**
 * 저장 전에 칸만 보고 판단한다. 서버를 부르지 않는다.
 * catalog가 null이면 이름표를 대조할 수 없다는 뜻이고, 이름표가 있으면 저장하지 않는다.
 */
export function assessTemplateSave(
  fields: readonly EditorField[],
  catalog: readonly string[] | null,
): SaveAssessment {
  const duplicates = findDuplicateParamKeys(
    fields.map((field) => (field.type === 'TEXT' ? field.paramKey : null)),
  );
  const ghostCount = fields.filter(isGhost).length;
  if (ghostCount > 0) {
    return { ok: false, reason: 'ghost', ghostCount, duplicates };
  }

  for (const field of fields) {
    const key = normalizedKey(field);
    if (!key) continue;
    if (!validateParamKey(key).ok) {
      return { ok: false, reason: 'invalid', fieldId: field.id, duplicates };
    }
  }

  const seen = new Set<string>();
  const keys: string[] = [];
  for (const field of fields) {
    const key = normalizedKey(field);
    if (!key) continue;
    const stored = normalizeParamKey(key);
    if (seen.has(stored)) continue;
    seen.add(stored);
    keys.push(stored);
  }

  if (keys.length === 0) {
    return { ok: true, duplicates, unknownKeys: [] };
  }
  if (catalog === null) {
    return { ok: false, reason: 'catalog', duplicates };
  }

  const known = knownKeys(catalog);
  const unknownKeys = keys.filter((key) => !known.has(key));
  if (unknownKeys.length > 0) {
    return { ok: false, reason: 'confirm', unknownKeys, duplicates };
  }
  return { ok: true, duplicates, unknownKeys: [] };
}
