'use client';

/* Страница турнира — раздел председателя ГСК ✳ (11.09.2026).

   Протокол — документ: уровень соревнования (C, п. 13), участники и то, что
   турнир дал их рейтингу, и все матчи с изменением у обоих игроков (п. 4.6:
   каждое изменение связано с матчем). По образцу Э5.4 «Протокол на
   утверждении» и Э5.10 «Карточка турнира».

   Мест на экране нет ✳ (11.09.2026, решение владельца продукта): итоговых
   мест в протоколах пилота не ведут. Сохранённые места (у турнира из сетки
   их ставит сетка) уходят в утверждение как есть; у турнира вручную их нет,
   и коэффициент призёра P у всех 1,00.

   Турнир протоколом вручную, пока не учтён, правится здесь же: участники из
   рейтинга или новые спортсмены, матчи — кто с кем и счёт. Утверждение
   завершает его и учитывает в рейтинге; «Вернуть на доработку» снимает учёт,
   если после турнира у участников не было других изменений.

   Предпросмотр: сервер считает утверждение по-настоящему и откатывает, и в
   таблицах сразу те числа, что даст сохранение. У черновика — всегда, у
   учтённого — когда изменили уровень. Если утвердить нельзя, сервер называет
   причину, кнопка неактивна.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { Button } from '@heroui/react';
import { Check, Plus, RotateCcw, Search, Undo2, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addProtocolMatch,
  addProtocolParticipant,
  coeff,
  num2,
  removeProtocolMatch,
  removeProtocolParticipant,
  reworkProtocol,
  ruDate,
  saveProtocol,
  signed2,
  useProtocol,
  useProtocolPreview,
  type ProtocolInput,
} from '@/entities/rating';
import { useSession } from '@/entities/session';
import { AthleteDialog, LEVELS, MatchDialog, ParticipantDialog } from '@/features/rating-admin';
import { EmptyBox, FilterBar, FilterSeg, Panel, Pill, Sheet, useNarrow } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const P_GRID = 'minmax(0,1fr) 84px 96px 84px';
const M_GRID = 'minmax(0,1fr) 90px 60px minmax(0,1fr) 90px 60px 60px';
/** Телефон ✳ (11.09.2026): у участника — изменение и итог; в матче —
    игроки с изменением под фамилией и счёт между ними. C и E — на десктопе. */
const P_GRID_NARROW = 'minmax(0,1fr) 88px 60px';
const M_GRID_NARROW = 'minmax(0,1fr) 36px minmax(0,1fr)';
const EDIT_COL = ' 32px';

const MatchSide = ({ name, won, delta }: { name: string; won: boolean; delta?: number }) => (
  <span className="min-w-0 leading-tight">
    <span className={'block truncate ' + (won ? 'font-semibold' : '')}>{name}</span>
    <span className={'block text-[11.5px] ' + tone(delta)}>{delta === undefined ? '—' : signed2(delta)}</span>
  </span>
);

type Ask = 'participant' | 'athlete' | 'match' | null;

const tone = (x: number | null | undefined) =>
  x === null || x === undefined ? 'text-neutral-400' : x > 0 ? 'text-green-700' : x < 0 ? 'text-red-600' : 'text-neutral-400';

const RemoveButton = ({ testId, onPress }: { testId: string; onPress: () => void }) => (
  <button
    type="button"
    aria-label="Убрать"
    data-testid={testId}
    onClick={onPress}
    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
  >
    <X size={14} />
  </button>
);

export function TournamentView({ id }: { id: string }) {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const saved = useProtocol(id);
  const base = saved.data;
  const narrow = useNarrow();

  // Уровень поверх сохранённого; null — «как сохранено».
  const [level, setLevel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  // Счётчик правок состава и матчей: предпросмотр черновика пересчитывается.
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/tournaments/' + id);
  }, [sessionLoading, isGskChairman, router, id]);

  const editable = !!base?.editable;
  const lvl = level ?? base?.level ?? 'republic';
  const dirty = !!base && lvl !== base.level;

  const input: ProtocolInput = useMemo(
    () => ({
      level: lvl,
      // Сохранённые места — как есть: на экране их не правят.
      places: Object.fromEntries(
        (base?.participants ?? []).filter((p) => p.place !== null).map((p) => [p.userId, p.place as number]),
      ),
      noThirdPlaceMatch: base?.noThirdPlaceMatch ?? false,
    }),
    [lvl, base],
  );

  const previewOn = dirty || (editable && (base?.matches.length ?? 0) > 0);
  const preview = useProtocolPreview(id, input, previewOn, rev);
  const shown = (previewOn ? preview.data : null) ?? base;
  const blocked = previewOn ? (preview.data?.blocked ?? null) : (base?.blocked ?? null);

  const refresh = useCallback(() => {
    setDone(null);
    setError(null);
    setRev((r) => r + 1);
    saved.reload();
  }, [saved]);

  /** Действие на странице (не в диалоге): ошибка — плашкой над таблицами. */
  async function act(run: () => Promise<unknown>, message?: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await run();
      setRev((r) => r + 1);
      saved.reload();
      if (message) setDone(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const draft = editable;
    await act(async () => {
      const d = await saveProtocol(id, input);
      setLevel(null);
      setDone(draft ? 'Утверждён и учтён в рейтинге' : 'Утверждён и пересчитан · ' + d.levelLabel);
    });
  }

  const levelLabel = LEVELS.find(([code]) => code === lvl)?.[1] ?? base?.levelLabel ?? '';
  const byId = new Map((shown?.participants ?? []).map((p) => [p.userId, p]));
  const pGrid = (narrow ? P_GRID_NARROW : P_GRID) + (editable ? EDIT_COL : '');
  const mGrid = (narrow ? M_GRID_NARROW : M_GRID) + (editable ? EDIT_COL : '');

  return (
    <RatingShell
      title={base?.name ?? 'Турнир'}
      active="Турниры"
      actions={
        base ? (
          <>
            {dirty && (
              <Button variant="ghost" onPress={() => setLevel(null)}>
                <RotateCcw size={15} /> Отменить изменения
              </Button>
            )}
            {base.manual && base.applied && (
              <Button
                variant="ghost"
                data-testid="protocol-rework"
                isDisabled={busy || !!base.blocked}
                onPress={() => void act(() => reworkProtocol(id), 'Возвращён на доработку')}
              >
                <Undo2 size={15} /> Вернуть на доработку
              </Button>
            )}
            <Button
              variant="primary"
              data-testid="protocol-save"
              isDisabled={busy || !!blocked || (previewOn && preview.loading) || (editable && !base.matches.length)}
              onPress={() => void save()}
            >
              <Check size={15} /> {editable ? 'Утвердить и учесть' : 'Утвердить и пересчитать'}
            </Button>
          </>
        ) : undefined
      }
    >
      {saved.error && <EmptyBox title="Турнир не загрузился" text={saved.error} />}

      {base && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
            <span>{ruDate(base.date)}</span>
            <span data-testid="protocol-state">
              {base.applied ? (
                <Pill t="учтён в рейтинге" color="success" />
              ) : (
                <Pill t={editable ? 'черновик' : 'не учтён'} />
              )}
            </span>
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
          {(error || (blocked && !(editable && !base.matches.length))) && (
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
          </FilterBar>

          <Panel
            title={'Участники · ' + base.participants.length}
            flush
            extra={
              editable ? (
                /* На телефоне — только значки: подписи не помещались рядом с
                   заголовком и обрезались. Имя кнопки остаётся в aria-label. */
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Из рейтинга"
                    isIconOnly={narrow}
                    data-testid="participant-add"
                    onPress={() => setAsk('participant')}
                  >
                    <Search size={14} />
                    {!narrow && ' Из рейтинга'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Новый спортсмен"
                    isIconOnly={narrow}
                    data-testid="participant-new"
                    onPress={() => setAsk('athlete')}
                  >
                    <UserPlus size={14} />
                    {!narrow && ' Новый спортсмен'}
                  </Button>
                </div>
              ) : undefined
            }
          >
            {base.participants.length ? (
              <Sheet
                flush
                grid={pGrid}
                cols={[
                  'Спортсмен',
                  ...(narrow ? [] : [<span key="b" className="block text-right">До</span>]),
                  <span key="d" className="block text-right">Изменение</span>,
                  <span key="a" className="block text-right">После</span>,
                  ...(editable ? [''] : []),
                ]}
              >
                {base.participants.map((p) => {
                  const s = byId.get(p.userId);
                  return (
                    <div
                      key={p.userId}
                      data-row
                      data-testid="protocol-participant"
                      data-player={p.name}
                      className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums"
                      style={{ gridTemplateColumns: pGrid }}
                    >
                      <span className="min-w-0 truncate font-medium">{p.name}</span>
                      {!narrow && (
                        <span className="text-right text-neutral-500">{s?.before === null || !s ? '—' : num2(s.before)}</span>
                      )}
                      <span className={'text-right font-semibold ' + tone(s?.change)}>
                        {s?.change === null || !s ? '—' : signed2(s.change)}
                      </span>
                      <span className="text-right font-semibold">{s?.after === null || !s ? '—' : num2(s.after)}</span>
                      {editable && (
                        <RemoveButton
                          testId="participant-remove"
                          onPress={() => void act(() => removeProtocolParticipant(id, p.userId))}
                        />
                      )}
                    </div>
                  );
                })}
              </Sheet>
            ) : (
              <div className="p-4">
                <EmptyBox title="Участников нет" text="" />
              </div>
            )}
          </Panel>

          <Panel
            title={'Матчи · ' + (shown?.matches.length ?? 0)}
            flush
            extra={
              editable && base.participants.length >= 2 ? (
                <Button size="sm" variant="ghost" data-testid="match-add" onPress={() => setAsk('match')}>
                  <Plus size={14} /> Матч
                </Button>
              ) : undefined
            }
          >
            {shown?.matches.length ? (
              <Sheet
                flush
                grid={mGrid}
                cols={
                  narrow
                    ? ['Спортсмен', 'Счёт', 'Соперник', ...(editable ? [''] : [])]
                    : [
                        'Спортсмен',
                        <span key="da" className="block text-right">Изменение</span>,
                        'Счёт',
                        'Соперник',
                        <span key="db" className="block text-right">Изменение</span>,
                        <span key="c" className="block text-right">C</span>,
                        <span key="e" className="block text-right">E</span>,
                        ...(editable ? [''] : []),
                      ]
                }
              >
                {shown.matches.map((m) => (
                  <div
                    key={m.id}
                    data-row
                    data-testid="protocol-match"
                    className={
                      'grid w-full items-center gap-3 px-4 py-2 text-left text-[12.5px] tabular-nums ' +
                      (m.counted || editable ? '' : 'opacity-50')
                    }
                    style={{ gridTemplateColumns: mGrid }}
                  >
                    {narrow ? (
                      <>
                        <MatchSide name={m.aName} won={m.winnerId === m.aId} delta={m.a?.delta} />
                        <span className="text-center text-neutral-600">{m.score}</span>
                        <MatchSide name={m.bName} won={m.winnerId === m.bId} delta={m.b?.delta} />
                      </>
                    ) : (
                      <>
                        <span className={'min-w-0 truncate ' + (m.winnerId === m.aId ? 'font-semibold' : '')}>{m.aName}</span>
                        <span className={'text-right ' + tone(m.a?.delta)}>{m.a ? signed2(m.a.delta) : '—'}</span>
                        <span className="text-neutral-600">{m.score}</span>
                        <span className={'min-w-0 truncate ' + (m.winnerId === m.bId ? 'font-semibold' : '')}>{m.bName}</span>
                        <span className={'text-right ' + tone(m.b?.delta)}>{m.b ? signed2(m.b.delta) : '—'}</span>
                        <span className="text-right text-neutral-500">{coeff(m.a?.c ?? null)}</span>
                        <span className="text-right text-neutral-500">{coeff(m.a?.expected ?? null)}</span>
                      </>
                    )}
                    {editable && (
                      <RemoveButton testId="match-remove" onPress={() => void act(() => removeProtocolMatch(id, m.id))} />
                    )}
                  </div>
                ))}
              </Sheet>
            ) : (
              <div className="p-4">
                <EmptyBox title="Матчей нет" text="" />
              </div>
            )}
          </Panel>

          {ask === 'participant' && (
            <ParticipantDialog
              exclude={base.participants.map((p) => p.userId)}
              onClose={() => setAsk(null)}
              onPick={async (userId) => {
                await addProtocolParticipant(id, { userId });
                refresh();
              }}
            />
          )}
          {ask === 'athlete' && (
            <AthleteDialog
              sub={base.name}
              onClose={() => setAsk(null)}
              onSubmit={async (athlete) => {
                await addProtocolParticipant(id, { athlete });
                setAsk(null);
                refresh();
              }}
            />
          )}
          {ask === 'match' && (
            <MatchDialog
              players={base.participants.map((p) => [p.userId, p.name])}
              gamesToWin={base.gamesToWin}
              onClose={() => setAsk(null)}
              onSubmit={async (m) => {
                await addProtocolMatch(id, m);
                setAsk(null);
                refresh();
              }}
            />
          )}
        </>
      )}
    </RatingShell>
  );
}
