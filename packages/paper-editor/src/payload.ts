import { DEFAULT_FONT_SIZE_PCT } from '@wegooli/paper-core';
import type { TemplateField, TemplateFieldInput, UpdateTemplateBody } from '@wegooli/paper-client';

import type { EditorField } from './types';

export function fromWire(field: TemplateField, index = 0): EditorField {
  const type = field.type ?? 'SIGNATURE';
  return {
    id: field.id ?? `loaded-${index}`,
    pageNumber: field.pageNumber,
    posX: field.posX,
    posY: field.posY,
    width: field.width,
    height: field.height,
    required: field.required ?? false,
    type,
    imageFileKey: field.imageFileKey ?? null,
    imageMime: field.imageMime ?? null,
    imageUrl: field.imageUrl ?? null,
    textContent: field.textContent ?? null,
    fontSize: field.fontSize ?? null,
    label: field.label ?? null,
    paramKey: field.paramKey ?? null,
    signerSlot: field.signerSlot && field.signerSlot > 0 ? field.signerSlot : 1,
    inputType: field.inputType ?? null,
  };
}

export function toFieldPayload(field: EditorField): TemplateFieldInput {
  const base = {
    pageNumber: field.pageNumber,
    posX: field.posX,
    posY: field.posY,
    width: field.width,
    height: field.height,
    required: field.required,
    type: field.type,
    signerSlot: field.type === 'SIGNATURE' ? field.signerSlot || 1 : 1,
  };

  if (field.type === 'IMAGE') {
    return {
      ...base,
      ...(field.imageFileKey ? { imageFileKey: field.imageFileKey } : {}),
      ...(field.imageMime ? { imageMime: field.imageMime } : {}),
      label: null,
      paramKey: null,
    };
  }

  if (field.type === 'TEXT') {
    return {
      ...base,
      ...(field.textContent != null ? { textContent: field.textContent } : {}),
      fontSize: field.fontSize && field.fontSize > 0 ? field.fontSize : DEFAULT_FONT_SIZE_PCT,
      label: field.label,
      paramKey: field.paramKey,
      inputType: field.inputType ?? 'TEXT',
    };
  }

  return base;
}

/** 서명 자리 이름(signers)은 넣지 않는다. 넣으면 서버가 그 이름을 지울 수 있다. */
export function toUpdateBody(
  fields: readonly EditorField[],
  meta?: { title?: string; description?: string },
): UpdateTemplateBody {
  const body: UpdateTemplateBody = {
    fields: fields.map(toFieldPayload),
  };
  if (meta?.title !== undefined) body.title = meta.title;
  if (meta?.description !== undefined) body.description = meta.description;
  return body;
}
