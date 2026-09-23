import { describe, expect, it } from 'vitest';

import { assessTemplateSave } from './assess';
import type { EditorField } from './types';

function text(patch: Partial<EditorField> & Pick<EditorField, 'id'>): EditorField {
  return {
    pageNumber: 1,
    posX: 0,
    posY: 0,
    width: 10,
    height: 5,
    required: false,
    type: 'TEXT',
    imageFileKey: null,
    imageMime: null,
    imageUrl: null,
    textContent: '',
    fontSize: null,
    label: null,
    paramKey: null,
    signerSlot: 1,
    inputType: 'TEXT',
    ...patch,
  };
}

describe('저장 판단', () => {
  it('문구도 이름표도 없는 글자칸은 유령칸이다', () => {
    const result = assessTemplateSave([text({ id: 'a' })], []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ghost');
  });

  it('공백만 있는 문구도 유령칸이다', () => {
    const result = assessTemplateSave([text({ id: 'a', textContent: '   ', paramKey: '  ' })], ['rent']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ghost');
  });

  it('고정 문구만 있으면 저장할 수 있다', () => {
    const result = assessTemplateSave([text({ id: 'a', textContent: '월세' })], null);
    expect(result).toMatchObject({ ok: true, unknownKeys: [] });
  });

  it('이름표만 있으면 저장할 수 있다', () => {
    const result = assessTemplateSave([text({ id: 'a', paramKey: 'rent' })], ['rent']);
    expect(result.ok).toBe(true);
  });

  it('형식이 틀린 이름표는 막는다', () => {
    const result = assessTemplateSave([text({ id: 'bad', paramKey: '1bad', textContent: '' })], ['1bad']);
    expect(result).toMatchObject({ ok: false, reason: 'invalid', fieldId: 'bad' });
  });

  it('같은 이름으로 모이는 칸은 경고만 하고 막지 않는다', () => {
    const result = assessTemplateSave(
      [
        text({ id: 'a', paramKey: 'senderName', textContent: '갑' }),
        text({ id: 'b', paramKey: 'sender_name', textContent: '을' }),
      ],
      ['sender_name'],
    );
    expect(result).toMatchObject({ ok: true, duplicates: ['sender_name'] });
  });

  it('낙타 표기는 목록의 저장형과 같은 이름이다', () => {
    const result = assessTemplateSave([text({ id: 'a', paramKey: 'senderName' })], ['sender_name']);
    expect(result.ok).toBe(true);
  });

  it('목록에 없는 이름은 확인이 필요하다', () => {
    const result = assessTemplateSave([text({ id: 'a', paramKey: 'new_rent' })], ['tenant_name']);
    expect(result).toMatchObject({ ok: false, reason: 'confirm', unknownKeys: ['new_rent'] });
  });

  it('이름표가 있는데 목록이 없으면 대조 불가다', () => {
    const result = assessTemplateSave([text({ id: 'a', paramKey: 'rent' })], null);
    expect(result).toMatchObject({ ok: false, reason: 'catalog' });
  });
});
