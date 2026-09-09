'use client';

/* Итоговая таблица прогона — колонки Приложения 1 Положения: место, ФИО,
   рейтинг, матчи, победы, поражения, статус. Плюс старт и изменение: без них
   не видно главного — куда шкала сдвинула человека. */

import { num2, signed2, type PreviewStanding, type RatingOrigin } from '@/entities/rating';
import { Panel } from '@/shared/kit/app';

/* Фамилия забирает всю свободную ширину, служебные пометки уходят второй
   строкой под неё: колонкой они не помещались. */
const GRID = '24px minmax(0,1fr) 56px 66px 70px 44px 52px 62px';

const ORIGIN_LABEL: Record<RatingOrigin, string> = {
  new: 'старт 1,00 · п. 6.1',
  legacy: 'перенос · п. 6.3',
  ittf: 'ITTF · п. 17',
};

export function StandingsPanel({ table, calculating }: { table: PreviewStanding[]; calculating: boolean }) {
  const rows = [...table].sort((a, b) => b.rating - a.rating);

  return (
    <Panel
      title="Рейтинговая таблица после прогона"
      sub="Приложение 1 Положения: место, рейтинг, матчи, статус"
      extra={calculating ? <span className="text-[12px] text-neutral-400">считает сервер…</span> : undefined}
    >
      <div
        className="mb-1 grid gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>№</span>
        <span>Фамилия и имя</span>
        <span className="text-right">Старт</span>
        <span className="text-right">Рейтинг</span>
        <span className="text-right">Изменение</span>
        <span className="text-right">Матчи</span>
        <span className="text-right">В / П</span>
        <span>Статус</span>
      </div>

      <div className="divide-y divide-neutral-100" data-testid="standings">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="grid items-center gap-2 px-1 py-2 text-[13px]"
            style={{ gridTemplateColumns: GRID }}
            data-testid="standing-row"
            data-player={r.name}
          >
            <span className="text-neutral-400 tabular-nums">{i + 1}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{r.name}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-[11px] leading-tight text-neutral-400">
                <span>{ORIGIN_LABEL[r.origin]}</span>
                {r.transition_left > 0 && (
                  <span className="text-amber-700">переходный период, ещё {r.transition_left}</span>
                )}
                {!!r.prize_bonus && <span className="text-blue-700">за место {signed2(r.prize_bonus)}</span>}
              </span>
            </span>
            <span className="text-right tabular-nums text-neutral-500">{num2(r.start)}</span>
            <span className="text-right font-semibold tabular-nums" data-testid="rating-value">
              {num2(r.rating)}
            </span>
            <span
              className={
                'text-right tabular-nums ' +
                (r.delta > 0 ? 'text-green-700' : r.delta < 0 ? 'text-red-600' : 'text-neutral-400')
              }
            >
              {signed2(r.delta)}
            </span>
            <span className="text-right tabular-nums text-neutral-600">{r.matches}</span>
            <span className="text-right tabular-nums text-neutral-600">
              {r.wins} / {r.losses}
            </span>
            {/* Колонка «Статус» из Приложения 1: активен или новый. */}
            <span className="text-[12px] text-neutral-500">
              {r.matches || r.origin !== 'new' ? 'Активен' : 'Новый'}
            </span>
          </div>
        ))}
      </div>

      {!rows.length && <p className="py-6 text-center text-[13px] text-neutral-500">Спортсменов нет.</p>}
    </Panel>
  );
}
