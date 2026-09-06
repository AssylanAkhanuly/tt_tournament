'use client';

/* Соревнования: название, уровень (коэффициент C по таблице §13) и призовая
   тройка — от неё зависит коэффициент P (§10). Четвёртое место и ниже P не
   получают (§10.5), поэтому и полей здесь ровно три. */

import { Panel } from '@/shared/kit/app';
import { LEVEL_LABEL, type LabTournament, type Level } from '@/entities/rating';
import type { LabPlayerInput } from '@/features/rating-lab/useRatingLab';
import { Btn, Field, Select, Text } from './controls';

const LEVELS: { value: Level; label: string }[] = (Object.keys(LEVEL_LABEL) as Level[]).map((v) => ({
  value: v,
  label: LEVEL_LABEL[v],
}));

const PLACES = [1, 2, 3] as const;

export function TournamentsPanel({
  tournaments,
  players,
  levelC,
  onAdd,
  onUpdate,
  onRemove,
  onPlace,
}: {
  tournaments: LabTournament[];
  players: LabPlayerInput[];
  levelC: Record<Level, number>;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LabTournament>) => void;
  onRemove: (id: string) => void;
  onPlace: (tournamentId: string, playerId: string, place: number | null) => void;
}) {
  const byPlace = (t: LabTournament, place: number) =>
    Object.entries(t.places ?? {}).find(([, p]) => p === place)?.[0] ?? '';

  return (
    <Panel
      title="Соревнования"
      sub="Уровень задаёт коэффициент C (§13), призовая тройка — коэффициент P (§10)"
      extra={
        <Btn onClick={onAdd} testId="add-tournament">
          Добавить соревнование
        </Btn>
      }
    >
      <div className="flex flex-col gap-3" data-testid="tournaments-list">
        {tournaments.map((t) => (
          <div key={t.id} className="rounded-xl border border-neutral-200 p-3">
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,2fr) 80px 34px' }}>
              <Field label="Название">
                <Text value={t.name} onChange={(v) => onUpdate(t.id, { name: v })} ariaLabel="Название соревнования" />
              </Field>
              <Field label="Уровень соревнования">
                <Select
                  value={t.level}
                  onChange={(v) => onUpdate(t.id, { level: v })}
                  options={LEVELS}
                  ariaLabel={'Уровень соревнования: ' + t.name}
                />
              </Field>
              <Field label="C">
                <div className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-right text-[13px] font-semibold tabular-nums">
                  {levelC[t.level].toFixed(2).replace('.', ',')}
                </div>
              </Field>
              <div className="flex items-end pb-0.5">
                <Btn onClick={() => onRemove(t.id)} tone="danger" ariaLabel={'Удалить соревнование ' + t.name}>
                  ×
                </Btn>
              </div>
            </div>

            <div className="mt-2.5 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
              {PLACES.map((place) => (
                <Field key={place} label={place + ' место · P = ' + (place === 1 ? '1,20' : place === 2 ? '1,15' : '1,10')}>
                  <Select
                    value={byPlace(t, place)}
                    onChange={(v) => {
                      // Пустое значение снимает место с того, кто его занимал:
                      // без этого «— не назначено —» ничего бы не меняло.
                      if (v) onPlace(t.id, v, place);
                      else {
                        const prev = byPlace(t, place);
                        if (prev) onPlace(t.id, prev, null);
                      }
                    }}
                    options={[{ value: '', label: '— не назначено —' }, ...players.map((p) => ({ value: p.id, label: p.name }))]}
                    ariaLabel={place + ' место: ' + t.name}
                  />
                </Field>
              ))}
            </div>

            <label className="mt-2.5 flex items-center gap-2 text-[12.5px] text-neutral-600">
              <input
                type="checkbox"
                checked={!!t.noThirdPlaceMatch}
                onChange={(e) => onUpdate(t.id, { noThirdPlaceMatch: e.target.checked })}
                aria-label={'Матча за третье место не было: ' + t.name}
              />
              Матча за 3-е место не было — оба полуфиналиста бронзовые, P = 1,10 (§10.4)
            </label>
          </div>
        ))}
      </div>
    </Panel>
  );
}
