import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_FONT_SIZE_PCT,
  fontSizeFromPercent,
  percentBoxToTopLeft,
} from '@wegooli/paper-core';

import { isDateField } from '../assess';
import { resizePercent, shiftPercent } from '../placement';
import { signerColorSlot } from '../signers';
import type { EditorClassNames, EditorField, PageSize } from '../types';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function kindOf(field: EditorField): 'signature' | 'text' | 'date' | 'image' {
  if (isDateField(field)) return 'date';
  if (field.type === 'TEXT') return 'text';
  if (field.type === 'IMAGE') return 'image';
  return 'signature';
}

/** 도구막대에서 끌어 오는 것. 날짜는 칸의 종류가 아니라 글자칸의 넣는 방법이다. */
export type PlaceTool = 'SIGNATURE' | 'TEXT' | 'DATE' | 'IMAGE';

function labelOf(field: EditorField): string {
  if (isDateField(field)) return '날짜칸';
  if (field.type === 'TEXT') return '글자칸';
  if (field.type === 'IMAGE') return '도장·그림';
  return '서명란';
}

interface ContractPagesProps {
  title: string;
  pages: readonly PageSize[];
  pageIndex: number;
  fields: readonly EditorField[];
  readOnly: boolean;
  selectedId: string | null;
  classNames?: EditorClassNames;
  onSelect: (id: string) => void;
  onChangeField: (id: string, patch: Partial<EditorField>) => void;
  onDelete: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  /** 1번부터 순서대로. 두 명 이상일 때만 칸 위에 이름을 띄운다. */
  signerNames?: readonly string[];
  onPlace?: (tool: PlaceTool, x: number, y: number) => void;
}

export function ContractPages({
  title,
  pages,
  pageIndex,
  fields,
  readOnly,
  selectedId,
  classNames,
  onSelect,
  onChangeField,
  onDelete,
  onPrev,
  onNext,
  signerNames = [],
  onPlace,
}: ContractPagesProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setFrameWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const page = pages[pageIndex];
  if (!page) return null;
  const pageNumber = pageIndex + 1;
  const visible = fields.filter((field) => field.pageNumber === pageNumber);
  const scale = frameWidth > 0 ? Math.min(1, frameWidth / page.width) : 1;

  return (
    <div>
      <h1>{title}</h1>
      <div className="wg-paper-toolbar">
        <button type="button" onClick={onPrev} disabled={pageIndex <= 0}>
          이전 쪽
        </button>
        <span>
          {pageNumber} / {pages.length}쪽
        </span>
        <button type="button" onClick={onNext} disabled={pageIndex >= pages.length - 1}>
          다음 쪽
        </button>
      </div>
      <div ref={frameRef} style={{ width: '100%', maxWidth: page.width }}>
        <div style={{ height: page.height * scale }}>
          <div
            className={joinClass('wg-paper-page', classNames?.page)}
            style={{
              position: 'relative',
              width: page.width,
              height: page.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            onDragOver={(event) => {
              if (readOnly || !onPlace) return;
              const types = Array.from(event.dataTransfer?.types ?? []);
              if (!types.includes('application/x-field-type')) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(event) => {
              if (readOnly || !onPlace) return;
              const type = event.dataTransfer?.getData('application/x-field-type');
              if (type !== 'SIGNATURE' && type !== 'TEXT' && type !== 'DATE' && type !== 'IMAGE') return;
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              const sx = rect.width > 0 ? page.width / rect.width : 1;
              const sy = rect.height > 0 ? page.height / rect.height : 1;
              const pointX = (event.clientX - rect.left) * sx;
              const pointY = (event.clientY - rect.top) * sy;
              if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) return;
              onPlace(type, pointX, pointY);
            }}
          >
            <PageCanvas page={page} />
            {visible.map((field) => (
              <FieldBox
                key={field.id}
                field={field}
                page={page}
                readOnly={readOnly}
                selected={field.id === selectedId}
                className={classNames?.box}
                onSelect={onSelect}
                onChangeField={onChangeField}
                onDelete={onDelete}
                signerNames={signerNames}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageCanvas({ page }: { page: PageSize }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!page.paint || !ref.current) return;
    void page.paint(ref.current);
  }, [page]);
  if (!page.paint) return null;
  return (
    <canvas
      ref={ref}
      width={page.width}
      height={page.height}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

function FieldBox({
  field,
  page,
  readOnly,
  selected,
  className,
  onSelect,
  onChangeField,
  onDelete,
  signerNames,
}: {
  field: EditorField;
  page: PageSize;
  readOnly: boolean;
  selected: boolean;
  className?: string;
  onSelect: (id: string) => void;
  onChangeField: (id: string, patch: Partial<EditorField>) => void;
  onDelete: (id: string) => void;
  signerNames: readonly string[];
}) {
  const box = percentBoxToTopLeft(field, page.width, page.height);
  const fontPercent = field.fontSize && field.fontSize > 0 ? field.fontSize : DEFAULT_FONT_SIZE_PCT;
  const fontPx = field.type === 'TEXT' ? fontSizeFromPercent(fontPercent, page.height) : undefined;
  const drag = useRef<{
    mode: 'move' | 'resize';
    x: number;
    y: number;
    posX: number;
    posY: number;
    width: number;
    height: number;
  } | null>(null);
  const style = {
    position: 'absolute' as const,
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    zIndex: 1,
    fontSize: fontPx,
  };
  const classNames = joinClass('wg-paper-box', className);
  const signerMark =
    field.type === 'SIGNATURE' ? String(signerColorSlot(field.signerSlot)) : undefined;
  const ownerName =
    field.type === 'SIGNATURE' && signerNames.length > 1
      ? (signerNames[(field.signerSlot || 1) - 1] ?? `${field.signerSlot || 1}번 서명자`)
      : null;
  const marks = (
    <>
      {field.required && (
        <span className="wg-paper-required" aria-label="필수">
          *
        </span>
      )}
      {field.label?.trim() && <span className="wg-paper-chip">{field.label.trim()}</span>}
      {ownerName && <span className="wg-paper-owner">{ownerName}</span>}
    </>
  );

  if (readOnly) {
    return (
      <div className={classNames} data-kind={kindOf(field)} data-signer={signerMark} style={style}>
        {marks}
        {field.type === 'IMAGE' && field.imageUrl ? (
          <img className="wg-paper-image" src={field.imageUrl} alt={labelOf(field)} draggable={false} />
        ) : (
          labelOf(field)
        )}
      </div>
    );
  }

  function pageDelta(event: ReactPointerEvent<HTMLElement>, startX: number, startY: number) {
    const rect = event.currentTarget.closest('.wg-paper-page')?.getBoundingClientRect();
    const sx = rect && rect.width > 0 ? page.width / rect.width : 1;
    const sy = rect && rect.height > 0 ? page.height / rect.height : 1;
    return { dx: (event.clientX - startX) * sx, dy: (event.clientY - startY) * sy };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    drag.current = {
      mode: 'move',
      x: event.clientX,
      y: event.clientY,
      posX: field.posX,
      posY: field.posY,
      width: field.width,
      height: field.height,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start || start.mode !== 'move') return;
    const { dx, dy } = pageDelta(event, start.x, start.y);
    if (dx === 0 && dy === 0) return;
    onChangeField(field.id, shiftPercent(start, page.width, page.height, dx, dy));
  }

  function onPointerCancel() {
    drag.current = null;
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onResizeDown(event: ReactPointerEvent<HTMLSpanElement>) {
    event.stopPropagation();
    event.preventDefault();
    drag.current = {
      mode: 'resize',
      x: event.clientX,
      y: event.clientY,
      posX: field.posX,
      posY: field.posY,
      width: field.width,
      height: field.height,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onResizeMove(event: ReactPointerEvent<HTMLSpanElement>) {
    const start = drag.current;
    if (!start || start.mode !== 'resize') return;
    const { dx, dy } = pageDelta(event, start.x, start.y);
    onChangeField(field.id, resizePercent(start, page.width, page.height, dx, dy));
  }

  return (
    <button
      type="button"
      className={classNames}
      data-kind={kindOf(field)}
      data-signer={signerMark}
      aria-label={labelOf(field)}
      aria-pressed={selected}
      style={style}
      onClick={() => onSelect(field.id)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {marks}
      {isDateField(field) ? (
        <span className="wg-paper-date">
          <span aria-hidden="true">📅</span>
          {field.textContent?.trim() || field.dateFormat?.trim() || DEFAULT_DATE_FORMAT}
        </span>
      ) : field.type === 'TEXT' && field.paramKey?.trim() ? (
        <span className="wg-paper-fill">✎ {field.label?.trim() || '보낼 때 적기'}</span>
      ) : field.type === 'TEXT' ? (
        <input
          className="wg-paper-type"
          aria-label="글자칸 내용"
          value={field.textContent ?? ''}
          placeholder="텍스트 입력..."
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onChangeField(field.id, { textContent: event.target.value })}
        />
      ) : field.type === 'IMAGE' && field.imageUrl ? (
        <img className="wg-paper-image" src={field.imageUrl} alt="" draggable={false} />
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {field.type === 'IMAGE' ? '도장·그림' : '서명'}
        </span>
      )}
      <span
        className="wg-paper-x"
        role="button"
        aria-label="이 칸 지우기"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(field.id);
        }}
      >
        ×
      </span>
      {selected && (
        <span
          className="wg-paper-resize"
          aria-label="크기 조절"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      )}
    </button>
  );
}
