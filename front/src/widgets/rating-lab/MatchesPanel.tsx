'use client';

/* Матчи: кто с кем, в каком соревновании и с каким счётом. Учитываются только
   одиночные матчи официальных рейтинговых соревнований (п. 14.1), счёт
   обязателен (п. 14.3). На размер изменения счёт не влияет — S в формуле п. 9.2
   знает только победу и поражение; счёт нужен протоколу и истории (п. 20). */

import { Panel } from '@/shared/kit/app';
import type { LabMatchInput, LabPlayerInput, LabTournamentInput } from '@/features/rating-lab/types';
import { Btn, Select } from './controls';

const SCORES: [number, number][] = [
  [3, 0],
  [3, 1],
  [3, 2],
  [2, 3],
  [1, 3],
  [0, 3],
];

const GRID = 'minmax(0,1.4fr) minmax(0,1.3fr) 96px minmax(0,1.3fr) 34px';

export function MatchesPanel({
  matches,
  players,
  tournaments,
  onAdd,
  onUpdate,
  onRemove,
  onClear,
  onRoundRobin,
}: {
  matches: LabMatchInput[];
  players: LabPlayerInput[];
  tournaments: LabTournamentInput[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LabMatchInput>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onRoundRobin: () => void;
}) {
  const people = players.map((p) => ({ value: p.id, label: p.name }));
  const events = tournaments.map((t) => ({ value: t.id, label: t.name }));

  return (
    <Panel
      title="Матчи"
      sub="Одиночный разряд рейтингового соревнования (п. 14.1); счёт обязателен (п. 14.3)"
      extra={
        <div className="flex gap-2">
          <Btn onClick={onRoundRobin} testId="fill-round-robin">
            Круговая всех со всеми
          </Btn>
          <Btn onClick={onClear}>Очистить</Btn>
          <Btn onClick={onAdd} tone="primary" testId="add-match">
            Добавить матч
          </Btn>
        </div>
      }
    >
      <div
        className="mb-1.5 grid gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>Соревнование</span>
        <span>Спортсмен</span>
        <span>Счёт</span>
        <span>Соперник</span>
        <span />
      </div>

      <div className="flex flex-col gap-1.5" data-testid="matches-list">
        {matches.map((m) => (
          <div key={m.id} className="grid items-center gap-2" style={{ gridTemplateColumns: GRID }} data-row>
            <Select
              value={m.tournament}
              onChange={(v) => onUpdate(m.id, { tournament: v })}
              options={events}
              ariaLabel="Соревнование матча"
            />
            <Select
              value={m.a}
              onChange={(v) => onUpdate(m.id, { a: v })}
              options={people}
              ariaLabel="Спортсмен в матче"
            />
            <Select
              value={m.games[0] + ':' + m.games[1]}
              onChange={(v) => {
                const [x, y] = v.split(':').map(Number);
                onUpdate(m.id, { games: [x, y] as [number, number] });
              }}
              options={SCORES.map(([x, y]) => ({ value: x + ':' + y, label: x + ' : ' + y }))}
              ariaLabel="Счёт по партиям"
            />
            <Select
              value={m.b}
              onChange={(v) => onUpdate(m.id, { b: v })}
              options={people}
              ariaLabel="Соперник в матче"
            />
            <Btn onClick={() => onRemove(m.id)} tone="danger" ariaLabel="Удалить матч">
              ×
            </Btn>
          </div>
        ))}
      </div>

      {!matches.length && (
        <p className="py-6 text-center text-[13px] text-neutral-500">
          Матчей нет. Добавьте матч или сведите круговую — рейтинг пересчитается сразу.
        </p>
      )}
    </Panel>
  );
}
