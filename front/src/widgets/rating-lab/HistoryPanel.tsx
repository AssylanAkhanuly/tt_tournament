'use client';

/* История изменения рейтинга — таблица §20 Положения. Колонки её: дата,
   турнир, соперник, счёт, рейтинг до, изменение, рейтинг после. К ним добавлены
   E, K, C, P — из чего сложилось изменение: §4.6 требует прозрачности, а без
   слагаемых «+0,35» ничем не проверяемо. */

import { useState } from 'react';
import { Panel } from '@/shared/kit/app';
import type { HistoryRow } from '@/entities/rating';
import { Select, num2, signed2 } from './controls';

const GRID = 'minmax(0,1.5fr) minmax(0,1.3fr) minmax(0,1.3fr) 54px 62px 74px 66px 52px 46px 46px 46px';

export function HistoryPanel({ history, players }: { history: HistoryRow[]; players: { id: string; name: string }[] }) {
  const [filter, setFilter] = useState('');
  const rows = filter ? history.filter((h) => h.player === filter) : history;

  return (
    <Panel
      title="История изменения рейтинга"
      sub="Таблица §20 Положения: каждое изменение привязано к конкретному матчу (§4.6)"
      extra={
        <div className="w-64">
          <Select
            value={filter}
            onChange={setFilter}
            options={[{ value: '', label: 'Все спортсмены' }, ...players.map((p) => ({ value: p.id, label: p.name }))]}
            ariaLabel="Показать историю спортсмена"
            testId="history-filter"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div
            className="mb-1 grid gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
            style={{ gridTemplateColumns: GRID }}
          >
            <span>Турнир</span>
            <span>Спортсмен</span>
            <span>Соперник</span>
            <span>Счёт</span>
            <span className="text-right">До</span>
            <span className="text-right">Изменение</span>
            <span className="text-right">После</span>
            <span className="text-right">E</span>
            <span className="text-right">K</span>
            <span className="text-right">C</span>
            <span className="text-right">P</span>
          </div>

          <div className="divide-y divide-neutral-100" data-testid="history">
            {rows.map((h, i) => (
              <div
                key={h.matchId + '-' + h.player + '-' + i}
                className="grid items-center gap-2 px-1 py-1.5 text-[12.5px]"
                style={{ gridTemplateColumns: GRID }}
                data-testid="history-row"
              >
                <span className="min-w-0 truncate text-neutral-500">{h.tournamentName}</span>
                <span className="min-w-0 truncate font-medium">{h.playerName}</span>
                <span className="min-w-0 truncate text-neutral-600">{h.opponentName}</span>
                <span className={'tabular-nums ' + (h.won ? 'text-green-700' : 'text-neutral-500')}>{h.score}</span>
                <span className="text-right tabular-nums text-neutral-500">{num2(h.before)}</span>
                <span
                  className={
                    'text-right font-semibold tabular-nums ' + (h.delta > 0 ? 'text-green-700' : h.delta < 0 ? 'text-red-600' : 'text-neutral-400')
                  }
                >
                  {signed2(h.delta)}
                  {h.capped && <span title="Упёрлось в потолок §12.1"> ⛔</span>}
                  {h.transition && <span title="Переходный период §11.2"> ●</span>}
                </span>
                <span className="text-right font-semibold tabular-nums">{num2(h.after)}</span>
                <span className="text-right tabular-nums text-neutral-500">{h.expected.toFixed(2).replace('.', ',')}</span>
                <span className="text-right tabular-nums text-neutral-500">{h.K}</span>
                <span className="text-right tabular-nums text-neutral-500">{h.C}</span>
                <span className="text-right tabular-nums text-neutral-500">{h.P}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!rows.length && (
        <p className="py-6 text-center text-[13px] text-neutral-500">
          Изменений нет: добавьте матчи, и каждая строка появится здесь.
        </p>
      )}

      <p className="mt-3 text-[11.5px] leading-snug text-neutral-500">
        ⛔ — изменение обрезано потолком §12.1. ● — матч переходного периода §11.2.
      </p>
    </Panel>
  );
}
