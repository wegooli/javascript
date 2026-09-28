import type { TemplateSigner } from '@wegooli/paper-client';

import type { EditorField } from './types';

/** 한 양식에 둘 수 있는 서명하는 분. 색이 다섯 가지다. */
export const MAX_SIGNER_SLOTS = 5;

/** 1부터. 다섯을 넘으면 앞 색으로 돌아간다. */
export function signerColorSlot(signerSlot: number): number {
  const slot = Math.trunc(signerSlot);
  const safe = slot >= 1 ? slot : 1;
  return ((safe - 1) % MAX_SIGNER_SLOTS) + 1;
}

export function peopleFrom(
  signers: readonly TemplateSigner[] | undefined,
  fields: readonly EditorField[],
): { count: number; roles: Record<number, string>; loaded: boolean } {
  const roles: Record<number, string> = {};
  let count = 1;
  if (Array.isArray(signers)) {
    for (const item of signers) {
      const slot = Math.trunc(Number(item.slot));
      const role = item.role?.trim().slice(0, 50) ?? '';
      if (slot < 1 || slot > MAX_SIGNER_SLOTS || role === '') continue;
      roles[slot] = role;
      count = Math.max(count, slot);
    }
  }
  for (const field of fields) {
    if (field.type !== 'SIGNATURE') continue;
    const slot = Math.trunc(field.signerSlot) || 1;
    if (slot >= 1 && slot <= MAX_SIGNER_SLOTS) count = Math.max(count, slot);
  }
  return { count, roles, loaded: Array.isArray(signers) };
}

export function displayNames(count: number, roles: Readonly<Record<number, string>>): string[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const slot = index + 1;
    return roles[slot]?.trim() || `${slot}번 서명자`;
  });
}

/**
 * 적힌 자리 이름만 돌려준다.
 * 빈 목록은 서버에 보내지 않는다. 빈 목록은 「이름을 전부 지워라」라서,
 * 이름 없이 칸만 옮길 때 임대인·임차인 같은 호칭이 사라진다.
 */
export function namedSigners(count: number, roles: Readonly<Record<number, string>>): TemplateSigner[] {
  const out: TemplateSigner[] = [];
  for (let slot = 1; slot <= count; slot += 1) {
    const role = (roles[slot] ?? '').trim().slice(0, 50);
    if (role) out.push({ slot, role });
  }
  return out;
}

export function dropSignaturesBeyond(fields: readonly EditorField[], count: number): EditorField[] {
  return fields.filter((field) => field.type !== 'SIGNATURE' || (field.signerSlot || 1) <= count);
}
