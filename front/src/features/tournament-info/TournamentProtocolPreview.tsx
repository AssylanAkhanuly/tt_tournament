'use client';

import { Button, Spinner, Tooltip } from '@heroui/react';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { FORMAT_LABEL, LEVEL_LABEL, type TournamentInfo } from '@/entities/tournament';

import { downloadProtocolPdf, protocolFileName } from './protocolPdf';

export type ProtocolField =
  | 'name'
  | 'description'
  | 'dates'
  | 'city'
  | 'venue'
  | 'age'
  | 'format'
  | 'groupSize'
  | 'gamesToWin'
  | 'level'
  | 'isRating';

export const PROTOCOL_FIELD_LABEL: Record<ProtocolField, string> = {
  name: 'Название',
  description: 'Описание',
  dates: 'Даты проведения',
  city: 'Город',
  venue: 'Место проведения',
  age: 'Возраст участников',
  format: 'Система проведения',
  groupSize: 'Игроков в группе',
  gamesToWin: 'Матч до побед',
  level: 'Уровень',
  isRating: 'Рейтинговый статус',
};

const date = (value: string | null) => (value ? value.split('-').reverse().join('.') : '________________');

function Field({
  field,
  activeField,
  children,
  className = '',
}: {
  field: ProtocolField;
  activeField: ProtocolField | null;
  children: ReactNode;
  className?: string;
}) {
  const selected = field === activeField;
  return (
    <div
      data-protocol-field={field}
      data-active={selected || undefined}
      className={
        'border-l-2 px-2.5 py-1.5 transition-colors motion-reduce:transition-none ' +
        (selected ? 'border-blue-500 bg-blue-50 text-blue-950 ring-1 ring-inset ring-blue-200' : 'border-transparent') +
        ' ' +
        className
      }
    >
      {children}
    </div>
  );
}

function Line({
  field,
  activeField,
  children,
}: {
  field: ProtocolField;
  activeField: ProtocolField | null;
  children: ReactNode;
}) {
  return (
    <Field field={field} activeField={activeField}>
      <span className="font-semibold">{PROTOCOL_FIELD_LABEL[field]}: </span>
      {children}
    </Field>
  );
}

/** Проект документа из тех же данных, что и форма. Здесь нет утверждения,
 *  подписей или результатов, которых ещё нет в данных турнира. */
export function TournamentProtocolPreview({
  draft,
  activeField: focused,
  participants,
  mobileVisible,
  groupSizeInput,
}: {
  draft: TournamentInfo;
  activeField: ProtocolField | null;
  participants: number;
  mobileVisible: boolean;
  groupSizeInput?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const doc = useRef<HTMLElement>(null);
  // На время выгрузки подсветки поля нет — в файл идёт чистый документ.
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const activeField = exporting ? null : focused;

  async function download() {
    if (!doc.current) return;
    setExporting(true);
    setExportError(null);
    // Кадр — чтобы снялась подсветка, и только потом снимок.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      await downloadProtocolPdf(doc.current, protocolFileName(draft.name));
    } catch {
      setExportError('Файл не собрался — попробуйте ещё раз.');
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    const container = viewport.current;
    const target = container?.querySelector<HTMLElement>(`[data-protocol-field="${activeField}"]`);
    if (!container || !target || container.clientHeight === 0) return;
    const outer = container.getBoundingClientRect();
    const inner = target.getBoundingClientRect();
    if (inner.top < outer.top + 28 || inner.bottom > outer.bottom - 28) {
      // Прокручиваем только документ: фокус и положение формы остаются на месте.
      container.scrollTo({
        top: container.scrollTop + inner.top - outer.top - Math.max(28, (container.clientHeight - inner.height) / 2),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }, [activeField, mobileVisible]);

  const age =
    draft.ageMin !== null && draft.ageMax !== null
      ? `${draft.ageMin}–${draft.ageMax} лет`
      : draft.ageMin !== null
        ? `от ${draft.ageMin} лет`
        : draft.ageMax !== null
          ? `до ${draft.ageMax} лет`
          : 'без возрастных ограничений';

  return (
    <aside
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-neutral-100"
      aria-label="Протокол турнира"
      data-testid="protocol-preview"
    >
      <div ref={viewport} className="min-h-0 flex-1 overflow-auto p-4 xl:p-6" data-testid="protocol-scroll">
        <article
          ref={doc}
          className="relative mx-auto flex min-h-[680px] max-w-[620px] flex-col border border-neutral-200 bg-white px-5 py-8 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm [overflow-wrap:anywhere] sm:px-8"
          aria-label="Проект протокола турнира"
          data-testid="protocol-document"
        >
          {/* Скачать — в правом верхнем углу листа и остаётся там при прокрутке ✳
              (30.10.2026, решение владельца продукта): липкая полоса нулевой высоты
              (текст не сдвигает), отрицательные поля выносят кнопку из полей листа
              в угол, на 12 px от края. В файл кнопка не попадает (`data-export-skip`). */}
          <div
            className="sticky top-3 z-10 -mr-2 -mt-5 flex h-0 justify-end font-sans sm:-mr-5"
            data-export-skip
            data-testid="protocol-download-bar"
          >
            <Tooltip>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="Скачать PDF"
                className="rounded-xl"
                isDisabled={exporting}
                onPress={() => void download()}
                data-testid="protocol-download"
              >
                {exporting ? <Spinner size="sm" /> : <Download size={16} />}
              </Button>
              <Tooltip.Content>Скачать PDF</Tooltip.Content>
            </Tooltip>
          </div>
          {exportError && (
            <p className="mb-3 font-sans text-[12px] text-red-600" data-export-skip data-testid="protocol-download-error">
              {exportError}
            </p>
          )}
          <div className="mb-6 border-b border-neutral-800 pb-4 text-center text-[10px] font-semibold uppercase tracking-[0.08em]">
            Федерация настольного тенниса
            <br />
            Республики Казахстан
          </div>
          <h3 className="text-center text-[17px] font-bold uppercase tracking-[0.08em]">Протокол турнира</h3>
          <Field activeField={activeField} field="name" className="mt-2 text-center text-[15px] font-semibold">
            {draft.name.trim() || 'Наименование соревнования'}
          </Field>

          <section className="mt-6">
            <h4 className="mb-2 border-b border-neutral-200 pb-1 text-[13px] font-bold">1. Общие сведения</h4>
            <Line activeField={activeField} field="dates">
              {date(draft.startsOn)}
              {draft.endsAt && draft.endsAt !== draft.startsOn ? ' — ' + date(draft.endsAt) : ''}
            </Line>
            <Line activeField={activeField} field="city">
              {draft.city.trim() || '________________'}
            </Line>
            <Line activeField={activeField} field="venue">
              {draft.venue.trim() || '________________'}
            </Line>
            <Line activeField={activeField} field="level">
              {LEVEL_LABEL[draft.level]}
            </Line>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 border-b border-neutral-200 pb-1 text-[13px] font-bold">2. Участники соревнования</h4>
            <Line activeField={activeField} field="age">
              {age}
            </Line>
            <p className="px-3 py-1.5">
              <span className="font-semibold">Заявлено участников: </span>
              {participants}
            </p>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 border-b border-neutral-200 pb-1 text-[13px] font-bold">3. Порядок проведения</h4>
            <Line activeField={activeField} field="format">
              {FORMAT_LABEL[draft.format]}
            </Line>
            {draft.format === 'group_playoff' && (
              <Line activeField={activeField} field="groupSize">
                {groupSizeInput === undefined ? draft.groupSize : groupSizeInput || '—'}
              </Line>
            )}
            <Field activeField={activeField} field="gamesToWin">
              <span className="font-semibold">Продолжительность матча: </span>до {draft.gamesToWin} побед в партиях.
            </Field>
            <Line activeField={activeField} field="isRating">
              {draft.isRating
                ? 'Результаты учитываются в рейтинге игроков.'
                : 'Результаты не учитываются в рейтинге игроков.'}
            </Line>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 border-b border-neutral-200 pb-1 text-[13px] font-bold">
              4. Дополнительная информация
            </h4>
            <Field activeField={activeField} field="description" className="min-h-12 whitespace-pre-wrap">
              {draft.description.trim() ? draft.description : '—'}
            </Field>
          </section>

          <div className="mt-8 flex flex-col gap-4 border-t border-neutral-200 pt-5 text-xs">
            <p className="flex justify-between gap-3">
              <span>Главный судья</span>
              <span>________________</span>
            </p>
            <p className="flex justify-between gap-3">
              <span>Главный секретарь</span>
              <span>________________</span>
            </p>
          </div>
        </article>
      </div>
    </aside>
  );
}
