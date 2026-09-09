'use client';

/* Соревнования калибровки: название, уровень (коэффициент C по таблице п. 13)
   и призовая тройка — от неё коэффициент P (п. 10). Четвёртое место и ниже P не
   получают (п. 10.5), поэтому и полей здесь ровно три. */

import { Panel } from '@/shared/kit/app';
import { coeff, type CompetitionLevel } from '@/entities/rating';
import { LEVEL_LABEL, type LabPlayerInput, type LabTournamentInput, type ParamOverrides } from '@/features/rating-lab/types';
import { Btn, Field, Select, Text } from './controls';

const LEVELS: { value: CompetitionLevel; label: string }[] = (
  Object.keys(LEVEL_LABEL) as CompetitionLevel[]
).map((v) => ({ value: v, label: LEVEL_LABEL[v] }));

const PLACES = [1, 2, 3] as const;

export function TournamentsPanel({
  tournaments,
  players,
  params,
  onAdd,
  onUpdate,
  onRemove,
  onPlace,
}: {
  tournaments: LabTournamentInput[];
  players: LabPlayerInput[];
  params: ParamOverrides | null;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LabTournamentInput>) => void;
  onRemove: (id: string) => void;
  onPlace: (tournamentId: string, playerId: string, place: number | null) => void;
}) {
  const byPlace = (t: LabTournamentInput, place: number) =>
    Object.entries(t.places).find(([, p]) => p === place)?.[0] ?? '';

  const p = (n: 1 | 2 | 3) => coeff(params ? params.prize_p[String(n)] : null);

  return (
    <Panel
      title="Соревнования"
      sub="Уровень задаёт коэффициент C (п. 13), призовая тройка — коэффициент P (п. 10)"
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
                  {coeff(params ? params.level_c[t.level] : null)}
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
                <Field key={place} label={place + ' место · P = ' + p(place)}>
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
                    options={[
                      { value: '', label: '— не назначено —' },
                      ...players.map((x) => ({ value: x.id, label: x.name })),
                    ]}
                    ariaLabel={place + ' место: ' + t.name}
                  />
                </Field>
              ))}
            </div>

            <label className="mt-2.5 flex items-center gap-2 text-[12.5px] text-neutral-600">
              <input
                type="checkbox"
                checked={t.noThirdPlaceMatch}
                onChange={(e) => onUpdate(t.id, { noThirdPlaceMatch: e.target.checked })}
                aria-label={'Матча за третье место не было: ' + t.name}
              />
              Матча за 3-е место не было — оба полуфиналиста бронзовые (п. 10.4)
            </label>
          </div>
        ))}
      </div>
    </Panel>
  );
}
