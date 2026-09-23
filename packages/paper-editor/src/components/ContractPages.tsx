import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { DEFAULT_FONT_SIZE_PCT, fontSizeFromPercent, percentBoxToTopLeft } from '@wegooli/paper-core';

import { shiftPercent } from '../placement';
import type { EditorClassNames, EditorField, PageSize } from '../types';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function kindOf(field: EditorField): 'signature' | 'text' | 'image' {
  if (field.type === 'TEXT') return 'text';
  if (field.type === 'IMAGE') return 'image';
  return 'signature';
}

function labelOf(field: EditorField): string {
  if (field.type === 'TEXT') return '글자칸';
  if (field.type === 'IMAGE') return '그림';
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
  onPrev: () => void;
  onNext: () => void;
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
  onPrev,
  onNext,
}: ContractPagesProps) {
  const page = pages[pageIndex];
  if (!page) return null;
  const pageNumber = pageIndex + 1;
  const visible = fields.filter((field) => field.pageNumber === pageNumber);

  return (
    <div>
      <h1>{title}</h1>
      {pages.length > 1 && (
        <div className="wg-paper-toolbar">
          <button type="button" onClick={onPrev} disabled={pageIndex <= 0}>
            이전 쪽
          </button>
          <span>
            {pageNumber} / {pages.length}
          </span>
          <button type="button" onClick={onNext} disabled={pageIndex >= pages.length - 1}>
            다음 쪽
          </button>
        </div>
      )}
      <div
        className={joinClass('wg-paper-page', classNames?.page)}
        style={{ position: 'relative', width: page.width, height: page.height }}
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
          />
        ))}
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
}: {
  field: EditorField;
  page: PageSize;
  readOnly: boolean;
  selected: boolean;
  className?: string;
  onSelect: (id: string) => void;
  onChangeField: (id: string, patch: Partial<EditorField>) => void;
}) {
  const box = percentBoxToTopLeft(field, page.width, page.height);
  const fontPercent = field.fontSize && field.fontSize > 0 ? field.fontSize : DEFAULT_FONT_SIZE_PCT;
  const fontPx = field.type === 'TEXT' ? fontSizeFromPercent(fontPercent, page.height) : undefined;
  const drag = useRef<{ x: number; y: number } | null>(null);
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

  if (readOnly) {
    return (
      <div className={classNames} data-kind={kindOf(field)} style={style}>
        {labelOf(field)}
      </div>
    );
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dx === 0 && dy === 0) return;
    const next = shiftPercent(field, page.width, page.height, dx, dy);
    onChangeField(field.id, next);
  }

  return (
    <button
      type="button"
      className={classNames}
      data-kind={kindOf(field)}
      aria-label={labelOf(field)}
      aria-pressed={selected}
      style={style}
      onClick={() => onSelect(field.id)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {labelOf(field)}
    </button>
  );
}
