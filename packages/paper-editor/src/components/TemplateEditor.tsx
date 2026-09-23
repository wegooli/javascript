import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FONT_SIZE_PCT,
  findDuplicateParamKeys,
  normalizeParamKey,
  percentBoxToTopLeft,
  topLeftToPercentBox,
  validateParamKey,
} from '@wegooli/paper-core';
import { PaperApiError } from '@wegooli/paper-client';

import { assessTemplateSave, isGhost } from '../assess';
import { readPdfPages, thumbnailBlob } from '../pdf-pages';
import { fittedBoxWidthPx, newSignatureField, newTextField } from '../placement';
import { fromWire, toFieldPayload, toUpdateBody } from '../payload';
import type { EditorField, PageSize, TemplateEditorProps } from '../types';
import { ContractPages } from './ContractPages';

const GHOST_NOTICE =
  '이 글자칸은 비어 있어 저장할 수 없습니다. 문구를 적거나, 보낼 때 채우는 이름을 붙이세요.';
const SYSTEM_NOTICE = '기본으로 들어 있는 양식은 고칠 수 없습니다. 우리 양식으로 복사한 뒤 고치세요.';
const CONFIRM_NOTICE =
  '이 회사에서 아직 쓴 적이 없는 이름입니다. 값을 보내는 쪽과 글자가 다르면 계약서가 만들어지지 않습니다. 그래도 저장할까요?';
const CATALOG_NOTICE = '이름 목록을 가져오지 못해 저장하지 않았습니다';
const FORMAT_NOTICE = '영문으로 시작하고, 영문·숫자·밑줄·하이픈만, 64자 이하';
const DUPLICATE_NOTICE = '같은 이름이 다른 칸에도 있습니다. 두 칸에 같은 값이 들어갑니다.';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
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
  const [pages, setPages] = useState<readonly PageSize[]>(pagesProp ?? []);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [systemLocked, setSystemLocked] = useState(false);
  const [loading, setLoading] = useState(Boolean(templateId || file));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unknownKeys, setUnknownKeys] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      setUnknownKeys(null);
      setNotice(null);
      if (pagesProp) setPages(pagesProp);
      if (!templateId && !file) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (templateId) {
          const detail = await client.getTemplate(templateId);
          if (cancelled) return;
          setTemplateIdState(detail.id);
          setTitle(detail.title);
          setFields(detail.fields.map((field, index) => fromWire(field, index)));
          setSystemLocked(detail.source === 'SYSTEM');
          setPageIndex(0);
          if (!pagesProp) setPages(await readPdfPages(await client.getTemplatePdf(templateId)));
        } else if (file) {
          if (cancelled) return;
          setTemplateIdState(undefined);
          setSystemLocked(false);
          setTitle(titleProp?.trim() || '계약서');
          setFields([]);
          if (!pagesProp) setPages(await readPdfPages(await file.arrayBuffer()));
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
  }, [client, templateId, file, pagesProp, titleProp]);

  const page = pages[pageIndex];
  const selected = fields.find((field) => field.id === selectedId) ?? null;
  const duplicates = findDuplicateParamKeys(fields.map((field) => (field.type === 'TEXT' ? field.paramKey : null)));
  const ghostCount = fields.filter(isGhost).length;

  function patchField(id: string, patch: Partial<EditorField>) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
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
    if (!result.ok && result.reason === 'confirm' && !confirmedUnknown) {
      setUnknownKeys(result.unknownKeys);
      setNotice(null);
      return;
    }
    setUnknownKeys(null);
    setBusy(true);
    try {
      const thumbnail = await thumbnailBlob(pages);
      if (templateIdState) {
        const saved = await client.updateTemplate(templateIdState, toUpdateBody(fields, { title }));
        onSaved?.(saved.id);
      } else if (file) {
        const saved = await client.createTemplate({
          file,
          title: title.trim() || '계약서',
          fields: fields.map(toFieldPayload),
          ...(thumbnail ? { thumbnail } : {}),
        });
        setTemplateIdState(saved.id);
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
      setTemplateIdState(detail.id);
      setTitle(detail.title);
      setFields(detail.fields.map((field, index) => fromWire(field, index)));
      setSystemLocked(detail.source === 'SYSTEM');
      setSelectedId(null);
      setUnknownKeys(null);
      if (!pagesProp) setPages(await readPdfPages(await client.getTemplatePdf(cloned.id)));
    } catch (error) {
      setNotice(error instanceof PaperApiError && error.message ? error.message : '복사하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  const alertText = notice ?? (ghostCount > 0 ? GHOST_NOTICE : null);
  const selectedKey = selected?.type === 'TEXT' ? (selected.paramKey?.trim() ?? '') : '';
  const selectedKeyOk = selectedKey !== '' && validateParamKey(selectedKey).ok;

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
        <>
          <ContractPages
            title={title}
            pages={pages}
            pageIndex={pageIndex}
            fields={fields}
            readOnly={systemLocked}
            selectedId={selectedId}
            classNames={classNames}
            onSelect={setSelectedId}
            onChangeField={patchField}
            onPrev={() => setPageIndex((index) => Math.max(0, index - 1))}
            onNext={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
          />
          <p className="wg-paper-lead">서명은 서명란에, 적힐 글자는 글자칸에 둡니다.</p>
          {!systemLocked && (
            <div className={joinClass('wg-paper-toolbar', classNames?.toolbar)}>
              <button type="button" onClick={() => setFields((current) => [...current, newSignatureField(pageIndex + 1, page)])}>
                서명란 추가
              </button>
              <button type="button" onClick={() => setFields((current) => [...current, newTextField(pageIndex + 1, page)])}>
                글자칸 추가
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
          {selected && !systemLocked && selected.type === 'TEXT' && (
            <div className={joinClass('wg-paper-side', classNames?.sidePanel)}>
              <label>
                화면에 보일 이름
                <input
                  value={selected.label ?? ''}
                  onChange={(event) => patchField(selected.id, { label: event.target.value || null })}
                />
              </label>
              <label>
                양식에 박을 문구
                <textarea value={selected.textContent ?? ''} onChange={(event) => writeText(selected, event.target.value)} />
              </label>
              <label>
                보낼 때 채우는 이름
                <input
                  value={selected.paramKey ?? ''}
                  onChange={(event) => patchField(selected.id, { paramKey: event.target.value || null })}
                />
              </label>
              {selectedKey !== '' && !selectedKeyOk && <p>{FORMAT_NOTICE}</p>}
              {selectedKeyOk && normalizeParamKey(selectedKey) !== selectedKey && (
                <p>저장하면 {normalizeParamKey(selectedKey)} 로 맞춰집니다.</p>
              )}
              <button type="button" onClick={() => setFields((current) => current.filter((field) => field.id !== selected.id))}>
                이 칸 지우기
              </button>
            </div>
          )}
          {selected && !systemLocked && selected.type === 'SIGNATURE' && (
            <div className="wg-paper-side">
              <button type="button" onClick={() => setFields((current) => current.filter((field) => field.id !== selected.id))}>
                이 칸 지우기
              </button>
            </div>
          )}
          {selected && selected.type === 'IMAGE' && <p>이 그림은 그대로 저장됩니다.</p>}
        </>
      )}
    </div>
  );
}
