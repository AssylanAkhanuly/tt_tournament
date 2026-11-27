'use client';

/* История изменения рейтинга на карточке спортсмена. Сама карточка с
   24.11.2026 — вид профиля (`PlayerProfile` из `widgets/national`: шапка,
   показатели, динамика, личные встречи), эта таблица — блоком под ним.
   Прежняя карточка «без обёрток» (03.11.2026) снята решением владельца продукта.

   История — таблица п. 20 Положения со слагаемыми изменения: п. 4.6 требует,
   чтобы каждое изменение было связано с конкретным матчем и объяснимо.
   Ссылок на пункты Положения на экране нет ✳ (10.09.2026): подписи видов
   записей приходят с сервера с «(п. …)» — их отрезает `plainLabel`. */

import { coeff, num2, plainLabel, ruDate, signed2, type RatingCard, type RatingEntry } from '@/entities/rating';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

/** Вид записи задаёт, как её читать: матч, штраф или служебная строка. */
const KIND_TONE: Record<RatingEntry['kind'], string> = {
  match: 'text-neutral-500',
  start: 'text-brand-700',
  prize: 'text-brand-700',
  no_show: 'text-red-600',
  correction: 'text-amber-700',
  void: 'text-red-600',
  merge: 'text-brand-700',
  remove: 'text-red-600',
  restore: 'text-brand-700',
};

const right = (text: string) => <span className="block text-right">{text}</span>;

const COLUMNS: DataColumn<RatingEntry>[] = [
  {
    id: 'date',
    label: 'Дата',
    className: 'w-28',
    render: (h) => <span className="tabular-nums text-neutral-500">{ruDate(h.occurredAt)}</span>,
  },
  {
    id: 'what',
    label: 'Турнир или основание',
    rowHeader: true,
    render: (h) => (
      <span className="block min-w-0 max-w-[24rem]">
        <span className="block truncate">
          {h.tournamentName ?? <span className={KIND_TONE[h.kind]}>{plainLabel(h.kindLabel)}</span>}
        </span>
        {/* У стартовой строки основание — служебное происхождение старта;
            основание неявки и исправления пишет человек. */}
        {h.reason && h.kind !== 'start' && <span className="block truncate text-[12px] text-neutral-400">{h.reason}</span>}
      </span>
    ),
  },
  { id: 'opponent', label: 'Соперник', render: (h) => <span className="text-neutral-600">{h.opponentName ?? '—'}</span> },
  {
    id: 'score',
    label: 'Счёт',
    className: 'w-16',
    render: (h) => <span className={'tabular-nums ' + (h.won ? 'text-green-700' : 'text-neutral-500')}>{h.score || '—'}</span>,
  },
  { id: 'before', label: right('До'), align: 'right', render: (h) => <span className="tabular-nums text-neutral-500">{num2(h.before)}</span> },
  {
    id: 'delta',
    label: right('Изменение'),
    align: 'right',
    render: (h) => (
      <span
        className={
          'font-semibold tabular-nums ' + (h.delta > 0 ? 'text-green-700' : h.delta < 0 ? 'text-red-600' : 'text-neutral-400')
        }
      >
        {signed2(h.delta)}
        {h.capped && <span title="Обрезано потолком"> ⛔</span>}
        {h.transition && <span title="Переходный период"> ●</span>}
      </span>
    ),
  },
  { id: 'after', label: right('После'), align: 'right', render: (h) => <span className="font-semibold tabular-nums">{num2(h.after)}</span> },
  { id: 'e', label: right('E'), align: 'right', render: (h) => <span className="tabular-nums text-neutral-500">{coeff(h.expected)}</span> },
  { id: 'k', label: right('K'), align: 'right', render: (h) => <span className="tabular-nums text-neutral-500">{coeff(h.k)}</span> },
  { id: 'c', label: right('C'), align: 'right', render: (h) => <span className="tabular-nums text-neutral-500">{coeff(h.c)}</span> },
  { id: 'p', label: right('P'), align: 'right', render: (h) => <span className="tabular-nums text-neutral-500">{coeff(h.p)}</span> },
];

/** Цвет точки статуса на фото: зелёная — активен (п. 18). */
export const STATUS_DOT: Record<RatingCard['profile']['status'], string> = {
  active: 'bg-green-500',
  inactive: 'bg-amber-400',
  no_matches: 'bg-neutral-300',
  void: 'bg-red-500',
};

/** История изменения рейтинга таблицей со слагаемыми — под профилем на
    карточке спортсмена ✳ (24.11.2026); график — блок «Динамика рейтинга» выше. */
export function CardHistory({ history }: { history: RatingEntry[] }) {
  return (
    <DataTable
      ariaLabel="История изменения рейтинга"
      testId="card-history"
      rows={history}
      columns={COLUMNS}
      getId={(h) => String(h.id)}
      pageSize={50}
      empty="Рейтинговых матчей у спортсмена ещё не было"
      rowProps={(h) => ({
        'data-testid': 'card-history-row',
        'data-kind': h.kind,
        'data-reverted': h.isReverted ? 'yes' : 'no',
      })}
    />
  );
}
