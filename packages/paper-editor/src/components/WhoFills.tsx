import { useState } from 'react';
import { normalizeParamKey, validateParamKey } from '@wegooli/paper-core';

import type { EditorField } from '../types';

const FORMAT_NOTICE = '영문으로 시작하고, 영문·숫자·밑줄·하이픈만, 64자 이하';

export function RequiredToggle({
  field,
  onChange,
}: {
  field: EditorField;
  onChange: (required: boolean) => void;
}) {
  return (
    <label className="wg-paper-check">
      <input
        type="checkbox"
        checked={field.required}
        onChange={(event) => onChange(event.target.checked)}
      />
      필수 입력
      <span>서명하는 사람이 반드시 채워야 합니다. 끄면 비워도 됩니다.</span>
    </label>
  );
}

/**
 * 글자칸은 셋 중 하나다.
 * 보낼 때 채우는 칸, 양식에 박힌 문구, 아무도 못 채우는 칸.
 * 마지막은 저장되지 않는다.
 */
export function WhoFills({
  field,
  fields,
  knownKeys,
  duplicate,
  onPatch,
  onAskSender,
  onDelete,
  className,
}: {
  field: EditorField;
  fields: readonly EditorField[];
  knownKeys: readonly { key: string; label: string | null }[] | null;
  duplicate: boolean;
  onPatch: (patch: Partial<EditorField>) => void;
  onAskSender: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const key = field.paramKey?.trim() ?? '';
  const label = field.label?.trim() ?? '';
  const hasFixedText = !!field.textContent?.trim();

  return (
    <div className={['wg-paper-side', 'wg-paper-who', className].filter(Boolean).join(' ')}>
      <h2>이 칸은 누가 채우나</h2>
      <RequiredToggle field={field} onChange={(required) => onPatch({ required })} />
      <label>
        이름표 (선택)
        <input
          value={field.label ?? ''}
          maxLength={200}
          placeholder="예: 입실기간"
          onChange={(event) => onPatch({ label: event.target.value || null })}
        />
      </label>
      {key ? (
        label ? (
          <p className="wg-paper-note">
            <b>보낼 때 채웁니다.</b> 새 계약서 화면에 「{label}」 칸이 생깁니다.
          </p>
        ) : (
          <p className="wg-paper-warn">
            <b>보낼 때 채웁니다.</b> 다만 새 계약서 화면이 「{key}」라고 물어봅니다 — 위에{' '}
            <b>이름표를 적어 주십시오.</b>
          </p>
        )
      ) : hasFixedText ? (
        <p className="wg-paper-note">
          <b>양식에 박힌 문구입니다.</b> 이 양식으로 만든 계약서마다 그대로 나옵니다.
        </p>
      ) : (
        <div className="wg-paper-warn">
          <p>
            <b>지금은 아무도 채울 수 없는 칸입니다.</b> 글자를 적어 두면 양식에 박히고, 아래 단추를
            누르면 보낼 때 채우는 칸이 됩니다.
          </p>
          <button type="button" onClick={onAskSender}>
            보낼 때 채우게 하기
          </button>
        </div>
      )}
      <AdvancedKey
        field={field}
        fields={fields}
        knownKeys={knownKeys}
        duplicate={duplicate}
        onPatch={onPatch}
      />
      <button type="button" onClick={onDelete}>
        이 칸 지우기
      </button>
    </div>
  );
}

/** 다른 시스템이 이 칸을 채울 때 쓰는 이름. 글자칸과 날짜칸이 같이 쓴다. */
function AdvancedKey({
  field,
  fields,
  knownKeys,
  duplicate,
  onPatch,
}: {
  field: EditorField;
  fields: readonly EditorField[];
  knownKeys: readonly { key: string; label: string | null }[] | null;
  duplicate: boolean;
  onPatch: (patch: Partial<EditorField>) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const key = field.paramKey?.trim() ?? '';
  const keyOk = key !== '' && validateParamKey(key).ok;
  const suggestions = suggestionKeys(field.id, fields, knownKeys);

  return (
    <div className="wg-paper-advanced">
      <button
        type="button"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        {advancedOpen ? '▾' : '▸'} 고급 · 외부 연동
        {key && <span className="wg-paper-key">{key}</span>}
      </button>
      {advancedOpen && (
        <div className="wg-paper-advanced-body">
          <label>
            연동 이름표
            <input
              value={field.paramKey ?? ''}
              maxLength={64}
              placeholder="예: tenant_name"
              list={`paramkey-${field.id}`}
              onChange={(event) => onPatch({ paramKey: event.target.value || null })}
            />
          </label>
          <p className="wg-paper-note">
            다른 시스템이 이 칸을 채울 때 쓰는 이름입니다. 연동 없이 직접 채우실 거면 이름은 아무거나
            괜찮습니다.
          </p>
          <datalist id={`paramkey-${field.id}`}>
            {suggestions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label ?? item.key}
              </option>
            ))}
          </datalist>
          {knownKeys !== null && knownKeys.length === 0 && suggestions.length === 0 && (
            <p className="wg-paper-note">연동 없음 — 맞출 이름이 없으니 그대로 두셔도 됩니다.</p>
          )}
          {key !== '' && !keyOk && <p className="wg-paper-warn">{FORMAT_NOTICE}</p>}
          {keyOk && normalizeParamKey(key) !== key && (
            <p className="wg-paper-note">저장하면 {normalizeParamKey(key)} 로 맞춰집니다.</p>
          )}
          {duplicate && (
            <p className="wg-paper-warn">같은 이름이 다른 칸에도 있습니다. 두 칸에 같은 값이 들어갑니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 날짜칸. 보내는 분이 달력에서 고르고, 계약서에는 2026-10-01 같은 글자가 찍힌다.
 * 서명하는 분이 고르는 칸이 아니다.
 */
export function DateFills({
  field,
  fields,
  knownKeys,
  duplicate,
  onPatch,
  onAskSender,
  onDelete,
  className,
}: {
  field: EditorField;
  fields: readonly EditorField[];
  knownKeys: readonly { key: string; label: string | null }[] | null;
  duplicate: boolean;
  onPatch: (patch: Partial<EditorField>) => void;
  onAskSender: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const key = field.paramKey?.trim() ?? '';
  const label = field.label?.trim() ?? '';
  const fixedDate = field.textContent?.trim() ?? '';

  return (
    <div className={['wg-paper-side', 'wg-paper-who', className].filter(Boolean).join(' ')}>
      <h2>날짜칸</h2>
      <RequiredToggle field={field} onChange={(required) => onPatch({ required })} />
      <label>
        이름표
        <input
          value={field.label ?? ''}
          maxLength={200}
          placeholder="예: 시작일"
          aria-invalid={key !== '' && label === ''}
          onChange={(event) => onPatch({ label: event.target.value || null })}
        />
      </label>
      {key ? (
        label ? (
          <p className="wg-paper-note">
            <b>보낼 때 채웁니다.</b> 새 계약서 화면에서 「{label}」을 달력으로 고르고, 계약서에는
            2026-10-01처럼 찍힙니다.
          </p>
        ) : (
          <p className="wg-paper-warn">
            <b>이름표를 적어 주십시오.</b> 보내는 분이 무슨 날짜를 고르는지 알아야 합니다.
          </p>
        )
      ) : fixedDate ? (
        <p className="wg-paper-note">
          <b>양식에 박힌 날짜입니다.</b> 이 양식으로 만든 계약서마다 {fixedDate}(이)가 그대로 나옵니다.
        </p>
      ) : (
        <div className="wg-paper-warn">
          <p>
            <b>지금은 아무도 채울 수 없는 칸입니다.</b>
          </p>
          <button type="button" onClick={onAskSender}>
            보낼 때 채우게 하기
          </button>
        </div>
      )}
      <AdvancedKey
        field={field}
        fields={fields}
        knownKeys={knownKeys}
        duplicate={duplicate}
        onPatch={onPatch}
      />
      <button type="button" onClick={onDelete}>
        이 칸 지우기
      </button>
    </div>
  );
}

function suggestionKeys(
  fieldId: string,
  fields: readonly EditorField[],
  knownKeys: readonly { key: string; label: string | null }[] | null,
): { key: string; label: string | null }[] {
  const byKey = new Map<string, string | null>();
  for (const item of knownKeys ?? []) {
    if (item.key.trim()) byKey.set(item.key, item.label);
  }
  for (const other of fields) {
    if (other.id === fieldId || other.type !== 'TEXT') continue;
    const otherKey = other.paramKey?.trim();
    if (otherKey && !byKey.has(otherKey)) byKey.set(otherKey, other.label);
  }
  return [...byKey].map(([key, label]) => ({ key, label }));
}
