import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import {
  DEFAULT_FONT_SIZE_PCT,
  findDuplicateParamKeys,
  normalizeParamKey,
  percentBoxToTopLeft,
  topLeftToPercentBox,
  validateParamKey,
} from '@wegooli/paper-core';
import { PaperApiError, type TemplateDetail, type TemplateSigner } from '@wegooli/paper-client';

import { assessTemplateSave, isDateField, isGhost } from '../assess';
import { readPdfPages, thumbnailBlob, usePdfPages, closePdfPages } from '../pdf-pages';
import {
  fittedBoxWidthPx,
  newSignatureField,
  newSignatureFieldAt,
  newTextField,
  newTextFieldAt,
} from '../placement';
import { fromWire, toFieldPayload, toUpdateBody } from '../payload';
import { displayNames, dropSignaturesBeyond, namedSigners, peopleFrom } from '../signers';
import type { EditorField, TemplateEditorProps } from '../types';
import { ContractPages, type PlaceTool } from './ContractPages';
import { SignerPeople } from './SignerPeople';
import { DateFills, RequiredToggle, WhoFills } from './WhoFills';

const GHOST_NOTICE =
  '이 글자칸은 비어 있어 저장할 수 없습니다. 문구를 적거나, 보낼 때 채우는 이름을 붙이세요.';
const SYSTEM_NOTICE = '기본으로 들어 있는 양식은 고칠 수 없습니다. 우리 양식으로 복사한 뒤 고치세요.';
const CONFIRM_NOTICE =
  '이 회사에서 아직 쓴 적이 없는 이름입니다. 값을 보내는 쪽과 글자가 다르면 계약서가 만들어지지 않습니다. 그래도 저장할까요?';
const CATALOG_NOTICE = '이름 목록을 가져오지 못해 저장하지 않았습니다';
const FORMAT_NOTICE = '영문으로 시작하고, 영문·숫자·밑줄·하이픈만, 64자 이하';
const DUPLICATE_NOTICE = '같은 이름이 다른 칸에도 있습니다. 두 칸에 같은 값이 들어갑니다.';
const UNNAMED_DATE_NOTICE = '날짜칸에 이름표를 적어 주십시오. 보내는 분이 무슨 날짜를 고르는지 알아야 합니다. (예: 시작일)';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function nextFillName(fields: readonly EditorField[], prefix = 'field'): string {
  const used = new Set(fields.map((field) => field.paramKey).filter((key): key is string => !!key));
  let n = 1;
  while (used.has(`${prefix}_${n}`)) n += 1;
  return `${prefix}_${n}`;
}

export function TemplateEditor({
  client,
  templateId,
  file,
  title: titleProp,
  expectedParamKeys,
  onSaved,
  classNames,
  pages: pagesProp,
}: TemplateEditorProps) {
  const [templateIdState, setTemplateIdState] = useState(templateId);
  const [title, setTitle] = useState(titleProp?.trim() || '계약서');
  const [fields, setFields] = useState<EditorField[]>([]);
  const { pages, show: showPdfPages } = usePdfPages(pagesProp ?? []);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [systemLocked, setSystemLocked] = useState(false);
  const [loading, setLoading] = useState(Boolean(templateId || file));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unknownKeys, setUnknownKeys] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [signerCount, setSignerCount] = useState(1);
  const [activeSigner, setActiveSigner] = useState(0);
  const [roles, setRoles] = useState<Record<number, string>>({});
  const [signersDirty, setSignersDirty] = useState(false);
  const [knownKeys, setKnownKeys] = useState<readonly { key: string; label: string | null }[] | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const draggedTool = useRef(false);

  function adopt(detail: TemplateDetail) {
    const nextFields = detail.fields.map((field, index) => fromWire(field, index));
    const people = peopleFrom(detail.signers, nextFields);
    setTemplateIdState(detail.id);
    setTitle(detail.title);
    setFields(nextFields);
    setSystemLocked(detail.source === 'SYSTEM');
    setSignerCount(people.count);
    setRoles(people.roles);
    setSignersDirty(false);
    setActiveSigner((current) => Math.min(current, people.count - 1));
  }

  function savedSigners(): { signers: TemplateSigner[] } | Record<string, never> {
    if (!signersDirty) return {};
    const signers = namedSigners(signerCount, roles);
    if (signers.length === 0) return {};
    return { signers };
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      setUnknownKeys(null);
      setNotice(null);
      if (pagesProp) showPdfPages(pagesProp, false);
      if (!templateId && !file) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (templateId) {
          const detail = await client.getTemplate(templateId);
          if (cancelled) return;
          adopt(detail);
          setPageIndex(0);
          if (!pagesProp) {
            const next = await readPdfPages(await client.getTemplatePdf(templateId));
            if (cancelled) {
              await closePdfPages(next);
              return;
            }
            showPdfPages(next, true);
          }
        } else if (file) {
          if (cancelled) return;
          setTemplateIdState(undefined);
          setSystemLocked(false);
          setTitle(titleProp?.trim() || '계약서');
          setFields([]);
          setSignerCount(1);
          setRoles({});
          setSignersDirty(false);
          setActiveSigner(0);
          if (!pagesProp) {
            const next = await readPdfPages(await file.arrayBuffer());
            if (cancelled) {
              await closePdfPages(next);
              return;
            }
            showPdfPages(next, true);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof PaperApiError && error.message ? error.message : '계약서를 불러오지 못했습니다',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [client, templateId, file, pagesProp, titleProp, showPdfPages]);

  useEffect(() => {
    if (expectedParamKeys) {
      setKnownKeys(expectedParamKeys.map((key) => ({ key, label: null })));
      return;
    }
    let cancelled = false;
    void client.listParamKeys().then(
      (listed) => {
        if (!cancelled) setKnownKeys(listed.keys.map((entry) => ({ key: entry.key, label: entry.label })));
      },
      () => {
        if (!cancelled) setKnownKeys([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, expectedParamKeys]);

  const page = pages[pageIndex];
  const selected = fields.find((field) => field.id === selectedId) ?? null;
  const duplicates = findDuplicateParamKeys(fields.map((field) => (field.type === 'TEXT' ? field.paramKey : null)));
  const ghostCount = fields.filter(isGhost).length;

  function patchField(id: string, patch: Partial<EditorField>) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  }

  function changeField(id: string, patch: Partial<EditorField>) {
    if (typeof patch.textContent === 'string' && Object.keys(patch).length === 1) {
      const field = fields.find((item) => item.id === id);
      if (field?.type === 'TEXT') {
        writeText(field, patch.textContent);
        return;
      }
    }
    patchField(id, patch);
  }

  function addField(tool: PlaceTool, at?: { x: number; y: number }) {
    if (!page) return;
    const slot = activeSigner + 1;
    const input = tool === 'DATE' ? 'DATE' : 'TEXT';
    const placed =
      tool === 'SIGNATURE'
        ? at
          ? newSignatureFieldAt(pageIndex + 1, page, at.x, at.y, slot)
          : newSignatureField(pageIndex + 1, page, slot)
        : at
          ? newTextFieldAt(pageIndex + 1, page, at.x, at.y, input)
          : newTextField(pageIndex + 1, page, input);
    // 날짜칸은 보내는 분이 달력으로 채운다. 양식에 박힌 날짜로 두지 않는다.
    const created = tool === 'DATE' ? { ...placed, paramKey: nextFillName(fields, 'date') } : placed;
    setFields((current) => [...current, created]);
    setSelectedId(created.id);
  }

  function onToolDragStart(event: ReactDragEvent<HTMLButtonElement>, type: PlaceTool) {
    draggedTool.current = true;
    event.dataTransfer.setData('application/x-field-type', type);
    event.dataTransfer.effectAllowed = 'copy';
  }

  function onToolClick(type: PlaceTool) {
    if (draggedTool.current) {
      draggedTool.current = false;
      return;
    }
    addField(type);
  }

  function changeSignerCount(next: number) {
    setSignerCount(next);
    setActiveSigner((current) => Math.min(current, next - 1));
    setSignersDirty(true);
    setFields((current) => dropSignaturesBeyond(current, next));
  }

  function writeText(field: EditorField, text: string) {
    const target = pages[field.pageNumber - 1];
    if (!target) {
      patchField(field.id, { textContent: text });
      return;
    }
    const current = percentBoxToTopLeft(field, target.width, target.height);
    const fontPercent = field.fontSize && field.fontSize > 0 ? field.fontSize : DEFAULT_FONT_SIZE_PCT;
    const nextWidth = fittedBoxWidthPx({
      measure: (value, size) => {
        const el = measureRef.current;
        if (!el) return 0;
        el.style.fontSize = `${size}px`;
        el.textContent = value;
        return el.offsetWidth;
      },
      text,
      fontPercent,
      viewportWidth: target.width,
      viewportHeight: target.height,
      pageWidth: target.width,
      currentWidthPx: current.width,
    });
    const next = topLeftToPercentBox(
      { x: current.x, y: current.y, width: nextWidth, height: current.height },
      target.width,
      target.height,
    );
    patchField(field.id, { textContent: text, width: next.width });
  }

  async function catalogForSave(): Promise<readonly string[] | null | undefined> {
    const hasKey = fields.some((field) => field.type === 'TEXT' && field.paramKey?.trim());
    if (!hasKey) return null;
    if (expectedParamKeys !== undefined) return expectedParamKeys;
    try {
      const listed = await client.listParamKeys();
      return listed.keys.map((entry) => entry.key);
    } catch {
      setNotice(CATALOG_NOTICE);
      setUnknownKeys(null);
      return undefined;
    }
  }

  async function handleSave(confirmedUnknown: boolean) {
    if (systemLocked || busy) return;
    setNotice(null);
    const catalog = await catalogForSave();
    if (catalog === undefined) return;
    const result = assessTemplateSave(fields, catalog);
    if (!result.ok && result.reason === 'ghost') {
      setNotice(GHOST_NOTICE);
      setUnknownKeys(null);
      return;
    }
    if (!result.ok && result.reason === 'unnamedDate') {
      setNotice(UNNAMED_DATE_NOTICE);
      setUnknownKeys(null);
      setSelectedId(result.fieldId);
      const target = fields.find((field) => field.id === result.fieldId);
      if (target) setPageIndex(target.pageNumber - 1);
      return;
    }
    if (!result.ok && result.reason === 'invalid') {
      setNotice(FORMAT_NOTICE);
      setUnknownKeys(null);
      return;
    }
    if (!result.ok && result.reason === 'catalog') {
      setNotice(CATALOG_NOTICE);
      setUnknownKeys(null);
      return;
    }
    if (!result.ok && result.reason === 'confirm') {
      const shown = unknownKeys;
      const next = result.unknownKeys;
      const sameAsShown =
        confirmedUnknown &&
        shown !== null &&
        shown.length === next.length &&
        shown.every((name, index) => name === next[index]);
      if (!sameAsShown) {
        setUnknownKeys(next);
        setNotice(null);
        return;
      }
    }
    setUnknownKeys(null);
    setBusy(true);
    try {
      const thumbnail = await thumbnailBlob(pages);
      const signers = savedSigners();
      if (templateIdState) {
        const saved = await client.updateTemplate(templateIdState, {
          ...toUpdateBody(fields, { title }),
          ...signers,
        });
        setSignersDirty(false);
        onSaved?.(saved.id);
      } else if (file) {
        const saved = await client.createTemplate({
          file,
          title: title.trim() || '계약서',
          fields: fields.map(toFieldPayload),
          ...(thumbnail ? { thumbnail } : {}),
          ...signers,
        });
        setTemplateIdState(saved.id);
        setSignersDirty(false);
        onSaved?.(saved.id);
      } else {
        setNotice('계약서를 열어 주세요.');
        return;
      }
      setNotice(null);
    } catch (error) {
      if (error instanceof PaperApiError && error.code === 'system_template_readonly') {
        setSystemLocked(true);
        setNotice(null);
        return;
      }
      setNotice(error instanceof PaperApiError && error.message ? error.message : '저장하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  async function handleClone() {
    if (!templateIdState || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const cloned = await client.cloneTemplate(templateIdState);
      const detail = await client.getTemplate(cloned.id);
      adopt(detail);
      setSelectedId(null);
      setUnknownKeys(null);
      if (!pagesProp) showPdfPages(await readPdfPages(await client.getTemplatePdf(cloned.id)), true);
    } catch (error) {
      setNotice(error instanceof PaperApiError && error.message ? error.message : '복사하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  const alertText = notice ?? (ghostCount > 0 ? GHOST_NOTICE : null);
  const selectedKey = selected?.type === 'TEXT' ? (selected.paramKey?.trim() ?? '') : '';
  const selectedKeyOk = selectedKey !== '' && validateParamKey(selectedKey).ok;
  const selectedDuplicate = selectedKeyOk && duplicates.includes(normalizeParamKey(selectedKey));
  const names = displayNames(signerCount, roles);
  const signatureCount = fields.filter((field) => field.type === 'SIGNATURE').length;
  const imageCount = fields.filter((field) => field.type === 'IMAGE').length;
  const textCount = fields.filter((field) => field.type === 'TEXT').length;
  const dateCount = fields.filter(isDateField).length;

  return (
    <div className={joinClass('wg-paper', classNames?.root)}>
      <span
        ref={measureRef}
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', pointerEvents: 'none' }}
      />
      {loading && <p>계약서를 불러오는 중</p>}
      {loadError && (
        <p role="alert" className="wg-paper-alert">
          {loadError}
        </p>
      )}
      {!loading && page && (
        <div className="wg-paper-work">
          {!systemLocked && (
            <SignerPeople
              count={signerCount}
              active={activeSigner}
              roles={roles}
              fields={fields}
              onCount={changeSignerCount}
              onActive={setActiveSigner}
              onRole={(slot, role) => {
                setRoles((current) => ({ ...current, [slot]: role }));
                setSignersDirty(true);
              }}
            />
          )}
          <div>
            {!systemLocked && (
              <div className={joinClass('wg-paper-toolbar', classNames?.toolbar)}>
                <p className="wg-paper-lead">
                  칸을 계약서 위로 끌어다 놓아 주십시오. 손으로 쓰는 기기에서는 버튼을 누르면 가운데에 놓입니다.
                </p>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => onToolDragStart(event, 'SIGNATURE')}
                  onDragEnd={() => {
                    window.setTimeout(() => {
                      draggedTool.current = false;
                    }, 0);
                  }}
                  onClick={() => onToolClick('SIGNATURE')}
                >
                  서명칸 놓기
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => onToolDragStart(event, 'TEXT')}
                  onDragEnd={() => {
                    window.setTimeout(() => {
                      draggedTool.current = false;
                    }, 0);
                  }}
                  onClick={() => onToolClick('TEXT')}
                >
                  글자칸 놓기
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => onToolDragStart(event, 'DATE')}
                  onDragEnd={() => {
                    window.setTimeout(() => {
                      draggedTool.current = false;
                    }, 0);
                  }}
                  onClick={() => onToolClick('DATE')}
                >
                  날짜칸 놓기
                </button>
                <button
                  type="button"
                  className={joinClass('wg-paper-primary', classNames?.primaryButton)}
                  disabled={busy}
                  onClick={() => void handleSave(false)}
                >
                  저장하기
                </button>
              </div>
            )}
            <ContractPages
              title={title}
              pages={pages}
              pageIndex={pageIndex}
              fields={fields}
              readOnly={systemLocked}
              selectedId={selectedId}
              classNames={classNames}
              signerNames={names}
              onPlace={(type, x, y) => addField(type, { x, y })}
              onSelect={setSelectedId}
              onChangeField={changeField}
              onDelete={(id) => {
                setFields((current) => current.filter((field) => field.id !== id));
                setSelectedId((current) => (current === id ? null : current));
              }}
              onPrev={() => setPageIndex((index) => Math.max(0, index - 1))}
              onNext={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
            />
            {!systemLocked && (
              <p className="wg-paper-hint">
                왼쪽에서 사람을 고르고, 계약서 위에 그분의 서명칸을 끌어다 놓아 주십시오. 칸마다 색이 그분의 색입니다.
              </p>
            )}
            {fields.length > 0 && (
              <p className="wg-paper-tally">
                서명 {signatureCount}개
                {imageCount > 0 ? ` · 이미지 ${imageCount}개` : ''}
                {textCount - dateCount > 0 ? ` · 텍스트 ${textCount - dateCount}개` : ''}
                {dateCount > 0 ? ` · 날짜 ${dateCount}개` : ''} 배치됨
                {ghostCount > 0 && <span className="wg-paper-ghost"> · 채울 수 없는 칸 {ghostCount}개</span>}
              </p>
            )}
            {systemLocked && (
              <div className="wg-paper-toolbar">
                <p>{SYSTEM_NOTICE}</p>
                <button type="button" className="wg-paper-primary" disabled={busy} onClick={() => void handleClone()}>
                  우리 양식으로 복사한 뒤 고치기
                </button>
              </div>
            )}
            {duplicates.length > 0 && <p>{DUPLICATE_NOTICE}</p>}
            {alertText && (
              <p role="alert" className="wg-paper-alert">
                {alertText}
              </p>
            )}
            {unknownKeys && (
              <div role="alertdialog" aria-label="아직 쓰지 않은 이름">
                <p>{CONFIRM_NOTICE}</p>
                <ul>
                  {unknownKeys.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
                <button type="button" disabled={busy} onClick={() => void handleSave(true)}>
                  그래도 저장
                </button>
                <button type="button" onClick={() => setUnknownKeys(null)}>
                  돌아가기
                </button>
              </div>
            )}
            {!systemLocked && !selected && textCount > 0 && (
              <p className="wg-paper-hint">
                글자칸을 누르면 이름을 붙일 수 있습니다. 이름을 붙여 두면 이 양식으로 보낼 때 그 이름으로 값을
                물어봅니다.
              </p>
            )}
            {selected && !systemLocked && isDateField(selected) && (
              <DateFills
                key={selected.id}
                className={classNames?.sidePanel}
                field={selected}
                fields={fields}
                knownKeys={knownKeys}
                duplicate={selectedDuplicate}
                onPatch={(patch) => patchField(selected.id, patch)}
                onAskSender={() => patchField(selected.id, { paramKey: nextFillName(fields, 'date') })}
                onDelete={() => {
                  setFields((current) => current.filter((field) => field.id !== selected.id));
                  setSelectedId(null);
                }}
              />
            )}
            {selected && !systemLocked && selected.type === 'TEXT' && !isDateField(selected) && (
              <WhoFills
                  key={selected.id}
                  className={classNames?.sidePanel}
                  field={selected}
                  fields={fields}
                  knownKeys={knownKeys}
                  duplicate={selectedDuplicate}
                  onPatch={(patch) => patchField(selected.id, patch)}
                  onAskSender={() => patchField(selected.id, { paramKey: nextFillName(fields) })}
                  onDelete={() => {
                    setFields((current) => current.filter((field) => field.id !== selected.id));
                    setSelectedId(null);
                  }}
                />
            )}
            {selected && !systemLocked && selected.type === 'SIGNATURE' && (
              <div className="wg-paper-side">
                <RequiredToggle field={selected} onChange={(required) => patchField(selected.id, { required })} />
                {signerCount > 1 && (
                  <div>
                    <p className="wg-paper-note">이 서명은 누구 것인가요</p>
                    <div className="wg-paper-toolbar">
                      {names.map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-pressed={(selected.signerSlot || 1) === index + 1}
                          aria-label={`${name} 서명으로`}
                          onClick={() => patchField(selected.id, { signerSlot: index + 1 })}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFields((current) => current.filter((field) => field.id !== selected.id));
                    setSelectedId(null);
                  }}
                >
                  이 칸 지우기
                </button>
              </div>
            )}
            {selected && selected.type === 'IMAGE' && <p>이 그림은 그대로 저장됩니다.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
