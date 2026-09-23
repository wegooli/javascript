import { DEFAULT_FONT_SIZE_PCT } from '@wegooli/paper-core';
import { describe, expect, it } from 'vitest';

import { fromWire, toFieldPayload, toUpdateBody } from './payload';
import { newSignatureField, newTextField } from './placement';

const page = { width: 500, height: 1000 };

describe('저장 본문', () => {
  it('그림 칸은 열쇠만 남기고 미리보기 주소는 빼며, 날짜 종류는 유지한다', () => {
    const image = fromWire({
      id: 'img',
      pageNumber: 1,
      posX: 1,
      posY: 2,
      width: 3,
      height: 4,
      type: 'IMAGE',
      imageFileKey: 'images/mark',
      imageMime: 'image/png',
      imageUrl: 'https://s3.example/mark',
    });
    const dated = fromWire({
      id: 'date',
      pageNumber: 1,
      posX: 5,
      posY: 6,
      width: 7,
      height: 8,
      type: 'TEXT',
      textContent: '2026-01-01',
      inputType: 'DATE',
      fontSize: 2,
      paramKey: null,
    });
    const body = toUpdateBody([image, dated], { title: '임대차' });

    expect(body).not.toHaveProperty('signers');
    expect(body).not.toHaveProperty('organizationId');
    expect(body.fields?.[0]).toMatchObject({
      type: 'IMAGE',
      imageFileKey: 'images/mark',
      imageMime: 'image/png',
    });
    expect(body.fields?.[0]).not.toHaveProperty('imageUrl');
    expect(body.fields?.[1]).toMatchObject({ inputType: 'DATE', fontSize: 2, textContent: '2026-01-01' });
  });

  it('senderName은 저장할 때 sender_name이 된다', () => {
    const named = fromWire({
      id: 'who',
      pageNumber: 1,
      posX: 0,
      posY: 0,
      width: 10,
      height: 5,
      type: 'TEXT',
      textContent: '갑',
      paramKey: '  senderName  ',
    });
    expect(toFieldPayload(named).paramKey).toBe('sender_name');

    const blank = fromWire({
      id: 'blank',
      pageNumber: 1,
      posX: 0,
      posY: 0,
      width: 10,
      height: 5,
      type: 'TEXT',
      textContent: '고정',
      paramKey: '   ',
    });
    expect(toFieldPayload(blank).paramKey).toBeNull();
  });

  it('새 글자칸의 글자 크기는 기본 퍼센트이고 14가 아니다', () => {
    const created = newTextField(1, page);
    expect(toFieldPayload(created).fontSize).toBe(DEFAULT_FONT_SIZE_PCT);
    expect(toFieldPayload(created).fontSize).not.toBe(14);
  });

  it('새 서명란의 자리는 1번이다', () => {
    const created = newSignatureField(1, page);
    expect(toFieldPayload(created).signerSlot).toBe(1);
    expect(toFieldPayload({ ...created, signerSlot: 2 }).signerSlot).toBe(2);
  });

  it('범위를 벗어난 퍼센트도 손대지 않으면 그대로다', () => {
    const outside = fromWire({
      id: 'out',
      pageNumber: 1,
      posX: -5,
      posY: 110,
      width: 150,
      height: 10,
      type: 'SIGNATURE',
    });
    expect(toFieldPayload(outside)).toMatchObject({ posX: -5, posY: 110, width: 150, height: 10 });
  });
});
