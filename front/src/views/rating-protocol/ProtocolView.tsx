'use client';

/* Страница протокола турнира — раздел председателя ГСК ✳ (11.09.2026).

   Протокол — документ: уровень соревнования (C, п. 13), итоговые места
   (P, п. 10), участники и то, что турнир дал их рейтингу, и все матчи с
   изменением у обоих игроков (п. 4.6: каждое изменение связано с матчем).
   Раньше уровень и места правились окном поверх списка, и не было видно, из
   каких результатов строится рейтинг. По образцу Э5.4 «Протокол на
   утверждении» и Э5.10 «Карточка турнира» — отдельная страница.

   Предпросмотр: изменили уровень или место — сервер считает утверждение
   по-настоящему и откатывает, и в таблицах сразу новые числа. Сохраняет
   только «Утвердить и пересчитать». Если утвердить нельзя (после турнира у
   участников были другие изменения), сервер называет причину, кнопка неактивна.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { Button } from '@heroui/react';
import { Check, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  coeff,
  num2,
  ruDate,
  saveProtocol,
  signed2,
  useProtocol,
  useProtocolPreview,
  type ProtocolInput,
} from '@/entities/rating';
import { useSession } from '@/entities/session';
import { EmptyBox, FilterBar, FilterSeg, Panel, Pill, Sheet } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

/** Таблица уровней п. 13 — подписи как в калибровке. */
const LEVELS: [string, string][] = [
  ['top', 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12'],
  ['republic', 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские'],
  ['region', 'Областные и городские'],
  ['amateur', 'Любительские'],
];
/** Место в строке участника: P есть только у призовой тройки (п. 10.5). */
const PLACES = ['—', '1', '2', '3'];

const P_GRID = '108px minmax(0,1fr) 84px 96px 84px';
const M_GRID = 'minmax(0,1fr) 90px 60px minmax(0,1fr) 90px 60px 60px';

const tone = (x: number | null | undefined) =>
  x === null || x === undefined ? 'text-neutral-400' : x > 0 ? 'text-green-700' : x < 0 ? 'text-red-600' : 'text-neutral-400';

export function ProtocolView({ id }: { id: string }) {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const saved = useProtocol(id);
  const base = saved.data;

  // Правки поверх сохранённого; null — «как сохранено».
  const [level, setLevel] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, number | null> | null>(null);
  const [noThird, setNoThird] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/protocols/' + id);
  }, [sessionLoading, isGskChairman, router, id]);

  const lvl = level ?? base?.level ?? 'republic';
  const nt = noThird ?? base?.noThirdPlaceMatch ?? false;
  const pls = useMemo(
    () => places ?? Object.fromEntries((base?.participants ?? []).map((p) => [p.userId, p.place])),
    [places, base],
  );
  const dirty =
    !!base &&
    (lvl !== base.level ||
      nt !== base.noThirdPlaceMatch ||
      base.participants.some((p) => (pls[p.userId] ?? null) !== p.place));

  const input: ProtocolInput = useMemo(
    () => ({
      level: lvl,
      places: Object.fromEntries(
        Object.entries(pls).filter(([, v]) => v !== null && v !== undefined) as [string, number][],
      ),
      noThirdPlaceMatch: nt,
    }),
    [lvl, pls, nt],
  );

  const preview = useProtocolPreview(id, input, dirty);
  const shown = (dirty ? preview.data : null) ?? base;
  const blocked = dirty ? (preview.data?.blocked ?? null) : (base?.blocked ?? null);

  function reset() {
    setLevel(null);
    setPlaces(null);
    setNoThird(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const d = await saveProtocol(id, input);
      reset();
      setDone('Утверждён и пересчитан · ' + d.levelLabel);
      saved.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const levelLabel = LEVELS.find(([code]) => code === lvl)?.[1] ?? base?.levelLabel ?? '';
  const byId = new Map((shown?.participants ?? []).map((p) => [p.userId, p]));

  return (
    <RatingShell
      title={base?.name ?? 'Протокол'}
      active="Протоколы"
      actions={
        base ? (
          <>
            {dirty && (
              <Button variant="ghost" onPress={reset}>
                <RotateCcw size={15} /> Отменить изменения
              </Button>
            )}
            <Button
              variant="primary"
              data-testid="protocol-save"
              isDisabled={busy || !!blocked || (dirty && preview.loading)}
              onPress={() => void save()}
            >
              <Check size={15} /> Утвердить и пересчитать
            </Button>
          </>
        ) : undefined
      }
    >
      {saved.error && <EmptyBox title="Протокол не загрузился" text={saved.error} />}

      {base && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
            <span>{ruDate(base.date)}</span>
            <Pill t={base.applied ? 'учтён в рейтинге' : 'не учтён'} color={base.applied ? 'success' : 'default'} />
            {dirty && (
              <span data-testid="protocol-dirty">
                <Pill t="не сохранено" color="warning" />
              </span>
            )}
          </div>

          {done && (
            <p
              data-testid="protocol-result"
              className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-800"
            >
              {done}
            </p>
          )}
          {(blocked || error) && (
            <p
              role="alert"
              data-testid="protocol-blocked"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800"
            >
              {error ?? blocked}
            </p>
          )}

          <FilterBar>
            <div data-testid="protocol-level">
              <FilterSeg
                items={LEVELS.map(([, label]) => label)}
                active={levelLabel}
                label="Уровень"
                onPick={(label) => setLevel(LEVELS.find(([, l]) => l === label)?.[0] ?? lvl)}
              />
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={nt} onChange={(e) => setNoThird(e.target.checked)} />
              Матча за 3-е место не было — оба полуфиналиста бронзовые
            </label>
          </FilterBar>

          <Panel title={'Участники · ' + base.participants.length} flush>
            <Sheet
              flush
              grid={P_GRID}
              cols={[
                'Место',
                'Спортсмен',
                <span key="b" className="block text-right">До</span>,
                <span key="d" className="block text-right">Изменение</span>,
                <span key="a" className="block text-right">После</span>,
              ]}
            >
              {base.participants.map((p) => {
                const s = byId.get(p.userId);
                const place = pls[p.userId] ?? null;
                return (
                  <div
                    key={p.userId}
                    data-row
                    data-testid="protocol-participant"
                    data-player={p.name}
                    className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums"
                    style={{ gridTemplateColumns: P_GRID }}
                  >
                    <FilterSeg
                      items={PLACES}
                      active={place ? String(place) : '—'}
                      onPick={(v) => setPlaces({ ...pls, [p.userId]: v === '—' ? null : Number(v) })}
                    />
                    <span className="min-w-0 truncate font-medium">{p.name}</span>
                    <span className="text-right text-neutral-500">{s?.before === null || !s ? '—' : num2(s.before)}</span>
                    <span className={'text-right font-semibold ' + tone(s?.change)}>
                      {s?.change === null || !s ? '—' : signed2(s.change)}
                    </span>
                    <span className="text-right font-semibold">{s?.after === null || !s ? '—' : num2(s.after)}</span>
                  </div>
                );
              })}
            </Sheet>
          </Panel>

          <Panel title={'Матчи · ' + (shown?.matches.length ?? 0)} flush>
            {shown?.matches.length ? (
              <Sheet
                flush
                grid={M_GRID}
                cols={[
                  'Спортсмен',
                  <span key="da" className="block text-right">Изменение</span>,
                  'Счёт',
                  'Соперник',
                  <span key="db" className="block text-right">Изменение</span>,
                  <span key="c" className="block text-right">C</span>,
                  <span key="e" className="block text-right">E</span>,
                ]}
              >
                {shown.matches.map((m) => (
                  <div
                    key={m.id}
                    data-row
                    data-testid="protocol-match"
                    className={
                      'grid w-full items-center gap-3 px-4 py-2 text-left text-[12.5px] tabular-nums ' +
                      (m.counted ? '' : 'opacity-50')
                    }
                    style={{ gridTemplateColumns: M_GRID }}
                  >
                    <span className={'min-w-0 truncate ' + (m.winnerId === m.aId ? 'font-semibold' : '')}>{m.aName}</span>
                    <span className={'text-right ' + tone(m.a?.delta)}>{m.a ? signed2(m.a.delta) : '—'}</span>
                    <span className="text-neutral-600">{m.score}</span>
                    <span className={'min-w-0 truncate ' + (m.winnerId === m.bId ? 'font-semibold' : '')}>{m.bName}</span>
                    <span className={'text-right ' + tone(m.b?.delta)}>{m.b ? signed2(m.b.delta) : '—'}</span>
                    <span className="text-right text-neutral-500">{coeff(m.a?.c ?? null)}</span>
                    <span className="text-right text-neutral-500">{coeff(m.a?.expected ?? null)}</span>
                  </div>
                ))}
              </Sheet>
            ) : (
              <div className="p-4">
                <EmptyBox title="Сыгранных матчей нет" text="" />
              </div>
            )}
          </Panel>
        </>
      )}
    </RatingShell>
  );
}
