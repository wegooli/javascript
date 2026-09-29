import { useState } from 'react';
import {
  DEFAULT_DATE_FORMAT,
  formatDate,
  normalizeParamKey,
  validateDateFormat,
  validateParamKey,
} from '@wegooli/paper-core';

import type { EditorField } from '../types';

const FORMAT_NOTICE = '영문으로 시작하고, 영문·숫자·밑줄·하이픈만, 64자 이하';

/** 미리보기 날짜. 월·일이 한 자리라 M과 MM, D와 DD의 차이가 보인다. */
const SAMPLE_DATE = '2026-03-05';

/** 자주 쓰는 모양. 「20__년 __월 __일」처럼 칸이 나뉜 양식은 연·월·일을 따로 쓴다. */
const DATE_PRESETS: readonly { pattern: string; name: string }[] = [
  { pattern: 'YYYY-MM-DD', name: '2026-03-05' },
  { pattern: 'YYYY년 M월 D일', name: '2026년 3월 5일' },
  { pattern: 'YYYY. M. D.', name: '2026. 3. 5.' },
  { pattern: 'YYYY', name: '연도만' },
  { pattern: 'M', name: '월만' },
  { pattern: 'D', name: '일만' },
];

const DATE_FORMAT_NOTICE: Record<'empty' | 'too_long' | 'no_token', string> = {
  empty: '',
  too_long: '모양은 40자까지 적을 수 있습니다.',
  no_token: 'YYYY(연), M·MM(월), D·DD(일) 중 하나는 들어 있어야 합니다.',
};

function panelClass(className?: string): string {
  return ['wg-paper-side', 'wg-paper-who', className].filter(Boolean).join(' ');
}

/** 비워 둘 수 있나. 누가 채우는 칸이냐에 따라 문장만 다르다. */
export function RequiredToggle({
  field,
  who,
  onChange,
}: {
  field: EditorField;
  who: 'sender' | 'signer';
  onChange: (required: boolean) => void;
}) {
  return (
    <label className="wg-paper-check">
      <input
        type="checkbox"
        checked={field.required}
        onChange={(event) => onChange(event.target.checked)}
      />
      {who === 'sender' ? '꼭 적어야 하는 칸' : '꼭 서명해야 하는 칸'}
      <span>
        {who === 'sender'
          ? '보내는 분이 비워 두면 계약서를 보낼 수 없습니다.'
          : '서명하는 분이 비워 두면 서명을 마칠 수 없습니다.'}
      </span>
    </label>
  );
}

/**
 * 글자칸에 무엇이 들어가나. 둘 중 하나다.
 * 보낼 때마다 적기(보낼 때 채울 이름이 있다), 항상 같은 글자(양식에 박힌 문구).
 * 보낼 때 채울 이름은 사람이 몰라도 되게 편집기가 붙인다. 사람은 칸 이름만 적는다.
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
  const filling = (field.paramKey?.trim() ?? '') !== '';
  const label = field.label?.trim() ?? '';
  const group = `wg-fill-${field.id}`;

  return (
    <div className={panelClass(className)}>
      <h2>이 칸에 무엇이 들어가나요?</h2>
      <div role="radiogroup" aria-label="이 칸에 무엇이 들어가나요?" className="wg-paper-choices">
        <label className="wg-paper-choice">
          <input type="radio" name={group} checked={filling} onChange={() => onAskSender()} />
          <b>보낼 때마다 적기</b>
          <span>계약서를 보내는 분이 매번 적습니다.</span>
        </label>
        {filling && (
          <div className="wg-paper-choice-body">
            <label>
              칸 이름
              <input
                value={field.label ?? ''}
                maxLength={200}
                placeholder="예: 임차인 이름"
                aria-invalid={label === ''}
                onChange={(event) => onPatch({ label: event.target.value || null })}
              />
            </label>
            {label ? (
              <p className="wg-paper-note">보낼 때 「{label}」을 물어봅니다.</p>
            ) : (
              <p className="wg-paper-warn">
                <b>칸 이름을 적어 주십시오.</b> 보내는 분이 이 이름을 보고 적습니다.
              </p>
            )}
            <RequiredToggle field={field} who="sender" onChange={(required) => onPatch({ required })} />
          </div>
        )}
        <label className="wg-paper-choice">
          <input
            type="radio"
            name={group}
            checked={!filling}
            onChange={() => onPatch({ paramKey: null, required: false })}
          />
          <b>항상 같은 글자</b>
          <span>이 양식으로 만드는 모든 계약서에 똑같이 들어갑니다.</span>
        </label>
        {!filling && (
          <div className="wg-paper-choice-body">
            <label>
              들어갈 글자
              <input
                value={field.textContent ?? ''}
                placeholder="예: 서울특별시 강남구 …"
                aria-invalid={!field.textContent?.trim()}
                onChange={(event) => onPatch({ textContent: event.target.value })}
              />
            </label>
            {!field.textContent?.trim() && (
              <p className="wg-paper-warn">
                <b>들어갈 글자를 적어 주십시오.</b> 비어 있으면 저장되지 않습니다.
              </p>
            )}
          </div>
        )}
      </div>
      {filling && (
        <AdvancedKey
          field={field}
          fields={fields}
          knownKeys={knownKeys}
          duplicate={duplicate}
          onPatch={onPatch}
        />
      )}
      <button type="button" onClick={onDelete}>
        이 칸 지우기
      </button>
    </div>
  );
}

/**
 * 다른 프로그램이 이 칸에 값을 넣을 때 쓰는 영문 이름. 개발자만 본다.
 * 연결하지 않으면 편집기가 붙인 이름(field_1, date_1 …) 그대로 두면 된다.
 */
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
        {advancedOpen ? '▾' : '▸'} 다른 프로그램과 연결 (개발자용)
      </button>
      {advancedOpen && (
        <div className="wg-paper-advanced-body">
          <label>
            연결 이름
            <input
              value={field.paramKey ?? ''}
              maxLength={64}
              placeholder="예: tenant_name"
              list={`paramkey-${field.id}`}
              onChange={(event) => onPatch({ paramKey: event.target.value || null })}
            />
          </label>
          <p className="wg-paper-note">
            다른 프로그램이 이 칸에 값을 넣을 때 쓰는 영문 이름입니다. 연결하지 않으면 그대로 두십시오.
          </p>
          <datalist id={`paramkey-${field.id}`}>
            {suggestions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label ?? item.key}
              </option>
            ))}
          </datalist>
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
 * 날짜칸. 보내는 분이 고르고, 계약서에는 정한 모양대로 찍힌다.
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
  const pattern = field.dateFormat ?? '';
  const shape = pattern.trim() ? pattern : DEFAULT_DATE_FORMAT;
  const check = pattern.trim() ? validateDateFormat(pattern) : ({ ok: true } as const);
  const isPreset = DATE_PRESETS.some((preset) => preset.pattern === shape);
  const [customOpen, setCustomOpen] = useState(!isPreset);
  // 한 날짜를 나눠 찍을 다른 날짜칸. 묶으면 보낼 때 한 번만 고른다.
  const partners = sharedDateKeys(field, fields);
  const joined = partners.some((item) => item.key === key);

  return (
    <div className={panelClass(className)}>
      <h2>날짜칸</h2>
      <p className="wg-paper-note">계약서를 보내는 분이 고릅니다.</p>
      {key ? (
        <>
          {partners.length > 0 && (
            <label>
              다른 날짜칸과 한 날짜로 묶기
              <select
                value={joined ? key : ''}
                onChange={(event) => {
                  const picked = partners.find((item) => item.key === event.target.value);
                  if (picked) onPatch({ paramKey: picked.key, label: picked.label });
                  else onAskSender();
                }}
              >
                <option value="">묶지 않음 — 따로 고름</option>
                {partners.map((item) => (
                  <option key={item.key} value={item.key}>
                    「{item.label ?? item.key}」와 한 날짜
                  </option>
                ))}
              </select>
            </label>
          )}
          {!joined && (
            <label>
              칸 이름
              <input
                value={field.label ?? ''}
                maxLength={200}
                placeholder="예: 계약 시작일"
                aria-invalid={label === ''}
                onChange={(event) => onPatch({ label: event.target.value || null })}
              />
            </label>
          )}
          {joined ? (
            <p className="wg-paper-note">보낼 때 「{label}」을 한 번 고르면 이 칸에도 들어갑니다.</p>
          ) : label ? (
            <p className="wg-paper-note">보낼 때 「{label}」을 물어봅니다.</p>
          ) : (
            <p className="wg-paper-warn">
              <b>칸 이름을 적어 주십시오.</b> 보내는 분이 무슨 날짜를 고르는지 알아야 합니다.
            </p>
          )}
          <RequiredToggle field={field} who="sender" onChange={(required) => onPatch({ required })} />
        </>
      ) : fixedDate ? (
        <p className="wg-paper-note">
          <b>양식에 박힌 날짜입니다.</b> 이 양식으로 만든 계약서마다 {fixedDate}(이)가 그대로 나옵니다.
        </p>
      ) : (
        <div className="wg-paper-warn">
          <p>
            <b>보내는 분이 고르게 하려면 아래를 누르십시오.</b>
          </p>
          <button type="button" onClick={onAskSender}>
            보낼 때 고르게 하기
          </button>
        </div>
      )}
      <div className="wg-paper-date-format">
        <p className="wg-paper-note">
          <b>계약서에 어떻게 찍을까요?</b>
        </p>
        <div className="wg-paper-formats" role="group" aria-label="날짜 모양">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.pattern}
              type="button"
              aria-pressed={shape === preset.pattern}
              onClick={() => {
                setCustomOpen(false);
                onPatch({ dateFormat: preset.pattern });
              }}
            >
              {preset.name}
            </button>
          ))}
          <button type="button" aria-pressed={customOpen} onClick={() => setCustomOpen(true)}>
            직접 적기
          </button>
        </div>
        {customOpen && (
          <>
            <label>
              모양 직접 적기
              <input
                value={pattern}
                maxLength={40}
                placeholder={DEFAULT_DATE_FORMAT}
                aria-invalid={!check.ok}
                onChange={(event) => onPatch({ dateFormat: event.target.value || null })}
              />
            </label>
            <p className="wg-paper-note">
              YYYY는 연도, M·MM은 월, D·DD는 일로 바뀌고 나머지 글자는 그대로 찍힙니다.
            </p>
          </>
        )}
        {check.ok ? (
          <p className="wg-paper-note">
            3월 5일을 고르면 <b className="wg-paper-date-sample">{formatDate(SAMPLE_DATE, shape)}</b>
          </p>
        ) : (
          <p className="wg-paper-warn">{DATE_FORMAT_NOTICE[check.reason]}</p>
        )}
        <p className="wg-paper-note">
          「20__년 __월 __일」처럼 칸이 나뉜 양식은 칸마다 연도만·월만·일만 고르고, 한 날짜로
          묶으면 보낼 때 한 번만 고릅니다.
        </p>
      </div>
      {key && (
        <AdvancedKey
          field={field}
          fields={fields}
          knownKeys={knownKeys}
          duplicate={duplicate}
          onPatch={onPatch}
        />
      )}
      <button type="button" onClick={onDelete}>
        이 칸 지우기
      </button>
    </div>
  );
}

/** 이 칸 말고, 보낼 때 채우는 다른 날짜칸의 이름. 한 이름에 하나만. */
function sharedDateKeys(
  field: EditorField,
  fields: readonly EditorField[],
): { key: string; label: string | null }[] {
  const byKey = new Map<string, string | null>();
  for (const other of fields) {
    if (other.id === field.id || other.type !== 'TEXT' || other.inputType !== 'DATE') continue;
    const otherKey = other.paramKey?.trim();
    if (!otherKey) continue;
    if (!byKey.has(otherKey) || (!byKey.get(otherKey) && other.label?.trim())) {
      byKey.set(otherKey, other.label?.trim() || null);
    }
  }
  return [...byKey].map(([key, label]) => ({ key, label }));
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
