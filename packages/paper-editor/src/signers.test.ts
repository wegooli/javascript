import { describe, expect, it } from 'vitest';

import { dropSignaturesBeyond, namedSigners, peopleFrom } from './signers';
import type { EditorField } from './types';

function signature(slot: number): EditorField {
  return {
    id: `s${slot}`,
    pageNumber: 1,
    posX: 0,
    posY: 0,
    width: 10,
    height: 5,
    required: false,
    type: 'SIGNATURE',
    imageFileKey: null,
    imageMime: null,
    imageUrl: null,
    textContent: null,
    fontSize: null,
    label: null,
    paramKey: null,
    signerSlot: slot,
    inputType: null,
    dateFormat: null,
  };
}

describe('서명하는 분', () => {
  it('빈 자리 이름은 저장 목록에 넣지 않는다', () => {
    expect(namedSigners(2, { 1: '  임대인  ', 2: '   ' })).toEqual([{ slot: 1, role: '임대인' }]);
    expect(namedSigners(1, { 1: '' })).toEqual([]);
  });

  it('사람을 줄이면 그 사람의 서명칸도 빠진다', () => {
    const text = { ...signature(1), id: 't', type: 'TEXT' as const };
    const kept = dropSignaturesBeyond([signature(1), signature(2), text], 1);
    expect(kept.map((field) => field.id)).toEqual(['s1', 't']);
  });

  it('칸이 2번에 있으면 사람이 두 명인 것으로 센다', () => {
    const people = peopleFrom(undefined, [signature(2)]);
    expect(people.count).toBe(2);
    expect(people.loaded).toBe(false);
    expect(peopleFrom([{ slot: 1, role: '임대인' }], []).roles[1]).toBe('임대인');
  });
});
