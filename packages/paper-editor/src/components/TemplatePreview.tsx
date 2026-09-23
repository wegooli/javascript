import { useEffect, useState } from 'react';
import { PaperApiError } from '@wegooli/paper-client';

import { closePdfPages, readPdfPages, usePdfPages } from '../pdf-pages';
import { fromWire } from '../payload';
import type { EditorField, TemplatePreviewProps } from '../types';
import { ContractPages } from './ContractPages';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function TemplatePreview({ client, templateId, classNames, pages: pagesProp }: TemplatePreviewProps) {
  const [title, setTitle] = useState('계약서');
  const [fields, setFields] = useState<EditorField[]>([]);
  const { pages, show: showPdfPages } = usePdfPages(pagesProp ?? []);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      if (pagesProp) showPdfPages(pagesProp, false);
      try {
        const detail = await client.getTemplate(templateId);
        if (cancelled) return;
        setTitle(detail.title);
        setFields(detail.fields.map((field, index) => fromWire(field, index)));
        if (!pagesProp) {
          const next = await readPdfPages(await client.getTemplatePdf(templateId));
          if (cancelled) {
            await closePdfPages(next);
            return;
          }
          showPdfPages(next, true);
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
  }, [client, templateId, pagesProp, showPdfPages]);

  return (
    <div className={joinClass('wg-paper', classNames?.root)}>
      {loading && <p>계약서를 불러오는 중</p>}
      {loadError && (
        <p role="alert" className="wg-paper-alert">
          {loadError}
        </p>
      )}
      {!loading && pages[pageIndex] && (
        <>
          <ContractPages
            title={title}
            pages={pages}
            pageIndex={pageIndex}
            fields={fields}
            readOnly
            selectedId={null}
            classNames={classNames}
            onSelect={() => {}}
            onChangeField={() => {}}
            onPrev={() => setPageIndex((index) => Math.max(0, index - 1))}
            onNext={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
          />
          <p className="wg-paper-lead">서명은 서명란에, 적힐 글자는 글자칸에 둡니다.</p>
        </>
      )}
    </div>
  );
}
