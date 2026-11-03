'use client';

/* Карточка спортсмена ✳ (новый вид 03.11.2026, решение владельца продукта:
   строго и без обёрток). На всю рабочую область, без карточек и полей вокруг —
   как таблицы приложения:
   - шапка: фото со статусом точкой в углу (зелёная — активен), ФИО, регион и
     год рождения; справа — текущий рейтинг крупно;
   - полоса показателей строками ячеек через черту: место, матчи, победы и
     поражения, доля побед, старт, последний матч (и позиция ITTF, неявки —
     если есть);
   - история изменения рейтинга — полоса с переключателем «Таблица · График»
     и общий `DataTable` во всю ширину; изменение рейтинга видно только здесь:
     выпусков нет.

   История — таблица п. 20 Положения со слагаемыми изменения: п. 4.6 требует,
   чтобы каждое изменение было связано с конкретным матчем и объяснимо.
   Ссылок на пункты Положения на экране нет ✳ (10.09.2026): подписи видов
   записей приходят с сервера с «(п. …)» — их отрезает `plainLabel`. */

import { Avatar } from '@heroui/react';
import { useState, type ReactNode } from 'react';

import { coeff, num2, plainLabel, ruDate, signed2, type RatingCard, type RatingEntry } from '@/entities/rating';
import { Line, Segmented } from '@/shared/kit/app';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

/** Вид записи задаёт, как её читать: матч, штраф или служебная строка. */
const KIND_TONE: Record<RatingEntry['kind'], string> = {
  match: 'text-neutral-500',
  start: 'text-blue-700',
  prize: 'text-blue-700',
  no_show: 'text-red-600',
  correction: 'text-amber-700',
  void: 'text-red-600',
  merge: 'text-blue-700',
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
const STATUS_DOT: Record<RatingCard['profile']['status'], string> = {
  active: 'bg-green-500',
  inactive: 'bg-amber-400',
  no_matches: 'bg-neutral-300',
  void: 'bg-red-500',
};

export function PlayerCard({ card, showName = true }: { card: RatingCard; showName?: boolean }) {
  const { profile: p, history, place, of } = card;
  const доля = p.matchesPlayed ? Math.round((p.wins / p.matchesPlayed) * 100) : null;

  // Таблица и график — два взгляда на одну историю ✳ (16.09.2026): в таблице
  // видно каждую запись со слагаемыми, на графике — куда движется значение.
  // Отменённые строки в линию не идут: значение карточки — сумма неотменённых.
  const [view, setView] = useState('Таблица');
  const points = [...history]
    .filter((h) => !h.isReverted)
    .reverse()
    .map((h) => ({
      t: ruDate(h.occurredAt),
      v: h.after,
      note: h.tournamentName ?? plainLabel(h.kindLabel),
      tone: h.delta > 0 ? ('up' as const) : h.delta < 0 ? ('down' as const) : undefined,
      lines: [
        ruDate(h.occurredAt),
        'рейтинг ' + num2(h.after) + (h.kind === 'start' ? '' : ' · ' + signed2(h.delta)),
        ...(h.opponentName ? [h.opponentName + (h.score ? ' · ' + h.score : '')] : []),
        ...(h.reason && h.kind !== 'start' ? [h.reason] : []),
      ],
    }));

  const facts: [string, ReactNode][] = [
    ['Место в листе', '№' + place + ' из ' + of],
    ['Рейтинговых матчей', p.matchesPlayed],
    ['Побед и поражений', p.wins + ' / ' + p.losses],
    ['Доля побед', доля === null ? '—' : доля + ' %'],
    ['Стартовое значение', num2(p.startValue)],
    ...(p.ittfPosition ? ([['Позиция в ITTF на момент входа', p.ittfPosition]] as [string, ReactNode][]) : []),
    ['Последний рейтинговый матч', ruDate(p.lastMatchAt) || '—'],
    ...(p.noShows ? ([['Подтверждённых неявок', p.noShows]] as [string, ReactNode][]) : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-white" data-testid="player-card">
      <header className="flex flex-wrap items-center gap-4 border-b border-neutral-200 px-6 py-5">
        {/* Статус — точкой в углу фото ✳ (03.11.2026, решение владельца
            продукта), а не плашкой: зелёная — активен; подпись — в подсказке. */}
        <span className="relative shrink-0">
          <Avatar size="lg">
            <Avatar.Fallback>{p.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <span
            role="img"
            aria-label={p.statusLabel}
            title={p.statusLabel}
            data-testid="card-status"
            data-status={p.status}
            className={'absolute bottom-0.5 right-0.5 size-3.5 rounded-full ring-2 ring-white ' + STATUS_DOT[p.status]}
          />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          {showName && <h1 className="text-xl font-semibold tracking-tight">{p.name}</h1>}
          <p className="mt-1 text-[13px] text-neutral-500">
            {[p.region, p.ageCategory, p.birthYear ? p.birthYear + ' г. р.' : null].filter(Boolean).join(' · ') ||
              'Регион не указан'}
          </p>
        </div>
        <div className="text-right" data-testid="card-value">
          <p className="text-[12px] text-neutral-500">Текущий рейтинг</p>
          <p className="text-3xl font-semibold tabular-nums tracking-tight">{num2(p.value)}</p>
        </div>
      </header>

      <dl className="m-0 grid grid-cols-2 border-b border-neutral-200 sm:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {facts.map(([label, value]) => (
          <div key={label} className="border-b border-r border-neutral-100 px-6 py-3 xl:border-b-0" data-testid="card-fact">
            <dt className="text-[12px] text-neutral-500">{label}</dt>
            <dd className="m-0 mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-3">
        <h2 className="min-w-0 flex-1 text-[14px] font-semibold">История изменения рейтинга</h2>
        {history.length > 0 && (
          <div className="shrink-0 [&_[data-seg]]:flex-nowrap">
            <Segmented items={['Таблица', 'График']} value={view} onPick={setView} ariaLabel="Вид истории" />
          </div>
        )}
      </div>

      {view === 'График' && history.length ? (
        // На телефоне график — от края до края, поля только на широком экране.
        <div className="py-4 sm:px-6 sm:py-5" data-testid="card-chart">
          <Line points={points} label="История рейтинга" />
        </div>
      ) : (
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
      )}
    </div>
  );
}
