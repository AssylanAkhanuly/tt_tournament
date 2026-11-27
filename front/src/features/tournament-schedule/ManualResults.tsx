'use client';

/* Результаты вручную ✳ (03.11.2026, решение владельца продукта): таблица
   матчей без расписания — номер, пара, счёт в партиях — и «Добавить матч».
   Окно матча сверху вниз: спортсмен, его партии, партии соперника, соперник
   (из участников турнира, одного и того же с двух сторон не выбрать; партии
   «−/+» от 0 до числа побед матча); правила
   счёта проверяет сервер (`tournaments/manual_results.py`). Пока матчей нет —
   «Сменить способ» возвращает к выбору; после первого матча расписание у
   турнира уже не собрать.

   «Завершить турнир» ✳ (03.11.2026, решение владельца продукта) — с
   подтверждением: турнир завершается, рейтинг участников пересчитывает
   сервер. После этого матчи не меняются, а у таблицы два вида — «Рейтинг»
   (было, изменение, стало — по каждому сыгравшему) и «Матчи».

   «Итог без счёта» ✳ (27.11.2026, решение владельца продукта: «победа /
   поражение вручную, не влияет на рейтинг»): в окне матча переключатель
   «Счёт · Итог»; во «Итоге» вместо партий — победа или поражение спортсмена.
   Сервер хранит матч без счёта и в рейтинг его не берёт (`rated: false`); в
   таблице — «В : П» и пометка «вне рейтинга».

   «Вернуть турнир» ✳ (12.11.2026, решение владельца продукта) — только у
   последнего завершённого турнира, с подтверждением: рейтинг турнира
   откатывается, матчи снова правятся. Кнопку показывает `canUnfinish` —
   правило «последний» и отказы считает сервер (`manual_results.unfinish`).
   HeroUI + Tailwind. */

import { AlertDialog, Button, Chip, I18nProvider, Modal, NumberField, useOverlayState } from '@heroui/react';
import { Flag, Plus, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';

import {
  addManualMatch,
  finishManualResults,
  removeManualMatch,
  setManualResults,
  unfinishManualResults,
  type ManualMatch,
  type RatingChange,
  type Schedule,
} from '@/entities/tournament';
import { Segmented } from '@/shared/kit/app';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { AlertSheet, ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';
import { MatchPlayer } from './MatchPlayer';

function Games({
  label,
  value,
  max,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  testId: string;
}) {
  return (
    <I18nProvider locale="ru-RU">
      {/* Подписи у партий нет ✳ (03.11.2026): что чьё, видно по порядку —
          спортсмен над своими партиями, соперник под своими; подпись — для
          читалки. Ширина своя, узкая, по центру — число, а не поле ввода. */}
      <NumberField
        aria-label={label}
        value={value}
        onChange={(v) => !Number.isNaN(v) && onChange(v)}
        minValue={0}
        maxValue={max}
        step={1}
        className="w-40 self-center"
      >
        <NumberField.Group className="w-full rounded-xl">
          <NumberField.DecrementButton aria-label={'Меньше: ' + label} />
          <NumberField.Input className="w-full min-w-0 text-center tabular-nums" data-testid={testId} />
          <NumberField.IncrementButton aria-label={'Больше: ' + label} />
        </NumberField.Group>
      </NumberField>
    </I18nProvider>
  );
}

function AddMatch({ s, tournamentId, onSaved }: { s: Schedule; tournamentId: string; onSaved: (s: Schedule) => void }) {
  const state = useOverlayState();
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [ga, setGa] = useState(s.gamesToWin);
  const [gb, setGb] = useState(0);
  const [mode, setMode] = useState<'Счёт' | 'Итог'>('Счёт');
  const [won, setWon] = useState<'Победа' | 'Поражение'>('Победа');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = s.gamesToWin;
  const pair = !!a && !!b && a !== b;
  const ready = pair && (mode === 'Итог' || (Math.max(ga, gb) === n && Math.min(ga, gb) < n));
  const options = s.players.map((p) => ({ id: p.id, label: p.name }));

  const open = (isOpen: boolean) => {
    if (isOpen) {
      setA(null);
      setB(null);
      setGa(n);
      setGb(0);
      setMode('Счёт');
      setWon('Победа');
      setError(null);
    }
    state.setOpen(isOpen);
  };

  async function save() {
    if (!a || !b) return;
    setBusy(true);
    setError(null);
    try {
      const match = mode === 'Итог' ? { a, b, winner: won === 'Победа' ? a : b } : { a, b, scoreA: ga, scoreB: gb };
      onSaved(await addManualMatch(tournamentId, match));
      state.close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={state.isOpen} onOpenChange={open}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="manual-add">
        <Plus size={16} /> Добавить матч
      </Button>
      <ModalSheet size="sm" testId="manual-dialog">
        <Modal.CloseTrigger aria-label="Закрыть" />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Матч</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          {/* Сверху вниз, как читается матч ✳ (03.11.2026, решение владельца
              продукта): спортсмен, его партии, партии соперника, соперник. */}
          <Picker
            label="Спортсмен"
            showLabel
            value={a}
            options={options.filter((o) => o.id !== b)}
            onChange={setA}
            placeholder="Выберите"
            testId="manual-a"
          />
          {/* Вертикально ✳ (27.11.2026, решение владельца продукта): слева
              столбиком «Счёт / Итог», справа — партии или «В» над «П». */}
          <div className="flex items-stretch gap-3">
            <div role="tablist" aria-label="Что вносим" aria-orientation="vertical" className="flex flex-col gap-1 rounded-xl bg-neutral-100 p-1" data-testid="manual-mode">
              {(['Счёт', 'Итог'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={mode === v}
                  onClick={() => setMode(v)}
                  className={
                    'flex-1 cursor-pointer rounded-lg px-3 text-[13px] font-medium transition-colors ' +
                    (mode === v ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            {mode === 'Счёт' ? (
              <div className="flex flex-1 flex-col justify-center gap-2">
                <Games label="Партий у спортсмена" value={ga} max={n} onChange={setGa} testId="manual-score-a" />
                <Games label="Партий у соперника" value={gb} max={n} onChange={setGb} testId="manual-score-b" />
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-2" data-testid="manual-outcome">
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Итог спортсмена">
                  {(['Победа', 'Поражение'] as const).map((v) => {
                    const on = won === v;
                    const win = v === 'Победа';
                    return (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setWon(v)}
                        data-testid={win ? 'manual-win' : 'manual-loss'}
                        className={
                          'flex h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 transition-colors ' +
                          (on
                            ? win
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-red-600 bg-red-600 text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300')
                        }
                      >
                        <span className="w-8 text-center text-[34px] leading-none font-bold">{win ? 'В' : 'П'}</span>
                        <span className="text-[14px] font-medium">{v}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-center text-[12.5px] text-neutral-500">Не влияет на рейтинг</span>
              </div>
            )}
          </div>
          <Picker
            label="Соперник"
            showLabel
            value={b}
            options={options.filter((o) => o.id !== a)}
            onChange={setB}
            placeholder="Выберите"
            testId="manual-b"
          />
          {error && (
            <p role="alert" className="text-[13px] text-red-600" data-testid="manual-error">
              {error}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
            Отмена
          </Button>
          <Button
            variant="primary"
            className="rounded-xl"
            isDisabled={!ready || busy}
            onPress={() => void save()}
            data-testid="manual-save"
          >
            Сохранить
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </Modal>
  );
}

const num2 = (x: number) => x.toFixed(2).replace('.', ',');
const signed2 = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(2).replace('.', ',');

const RATING_COLUMNS: DataColumn<RatingChange>[] = [
  {
    id: 'player',
    label: 'Спортсмен',
    rowHeader: true,
    sortValue: (c) => c.player.name,
    render: (c) => <MatchPlayer person={c.player} />,
  },
  {
    id: 'before',
    label: 'Было',
    align: 'right',
    sortValue: (c) => c.before,
    render: (c) => <span className="tabular-nums text-neutral-500">{num2(c.before)}</span>,
  },
  {
    id: 'delta',
    label: 'Изменение',
    align: 'right',
    descFirst: true,
    sortValue: (c) => c.delta,
    render: (c) => (
      <span
        className={
          'font-semibold tabular-nums ' +
          (c.delta > 0 ? 'text-green-700' : c.delta < 0 ? 'text-red-600' : 'text-neutral-500')
        }
        data-testid="rating-delta"
      >
        {signed2(c.delta)}
      </span>
    ),
  },
  {
    id: 'after',
    label: 'Стало',
    align: 'right',
    sortValue: (c) => c.after,
    render: (c) => <span className="font-semibold tabular-nums">{num2(c.after)}</span>,
  },
];

function Finish({ s, onFinish }: { s: Schedule; onFinish: () => void }) {
  return (
    <AlertDialog>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="manual-finish">
        <Flag size={16} /> Завершить турнир
      </Button>
      <AlertSheet className="rounded-xl" testId="manual-finish-confirm">
        <AlertDialog.Header>
          <AlertDialog.Icon status="warning" />
          <AlertDialog.Heading>Завершить турнир?</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <p className="text-[14px]">
            Матчей: {s.manualMatches.length}
          </p>
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button slot="close" variant="tertiary" className="rounded-xl">
            Отмена
          </Button>
          <Button
            slot="close"
            variant="primary"
            className="rounded-xl"
            onPress={onFinish}
            data-testid="manual-finish-ok"
          >
            Завершить
          </Button>
        </AlertDialog.Footer>
      </AlertSheet>
    </AlertDialog>
  );
}

function Unfinish({ s, onUnfinish }: { s: Schedule; onUnfinish: () => void }) {
  return (
    <AlertDialog>
      <Button variant="tertiary" size="sm" className="rounded-xl" data-testid="manual-unfinish">
        <RotateCcw size={15} /> Вернуть турнир
      </Button>
      <AlertSheet className="rounded-xl" testId="manual-unfinish-confirm">
        <AlertDialog.Header>
          <AlertDialog.Icon status="warning" />
          <AlertDialog.Heading>Вернуть турнир из завершённых?</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <p className="text-[14px]">Изменений рейтинга к отмене: {s.ratingChanges.length}</p>
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button slot="close" variant="tertiary" className="rounded-xl">
            Отмена
          </Button>
          <Button
            slot="close"
            variant="danger"
            className="rounded-xl"
            onPress={onUnfinish}
            data-testid="manual-unfinish-ok"
          >
            Вернуть
          </Button>
        </AlertDialog.Footer>
      </AlertSheet>
    </AlertDialog>
  );
}

export function ManualResults({
  s,
  tournamentId,
  onChange,
}: {
  s: Schedule;
  tournamentId: string;
  onChange: (s: Schedule) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const finished = s.tournamentStatus === 'finished';
  const [view, setView] = useState<'Рейтинг' | 'Матчи'>('Рейтинг');
  const run = async (action: () => Promise<Schedule>) => {
    setError(null);
    try {
      onChange(await action());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: DataColumn<ManualMatch>[] = [
    {
      id: 'number',
      label: '№',
      className: 'w-14',
      render: (m) => <span className="tabular-nums text-neutral-500">{m.number}</span>,
    },
    {
      id: 'a',
      label: 'Спортсмен',
      rowHeader: true,
      render: (m) => (
        <span className={m.winner === m.player1.id ? 'font-semibold' : ''}>
          <MatchPlayer person={m.player1} />
        </span>
      ),
    },
    {
      id: 'score',
      label: 'Счёт',
      className: 'w-32',
      render: (m) =>
        m.rated ? (
          <span className="font-semibold tabular-nums" data-testid="manual-score">
            {m.score1}:{m.score2}
          </span>
        ) : (
          // Итог без счёта ✳ (27.11.2026): победа / поражение, в рейтинг не идёт.
          <span className="flex flex-col leading-tight" data-testid="manual-score" data-rated="no">
            <span className="font-semibold">{m.winner === m.player1.id ? 'В : П' : 'П : В'}</span>
            <span className="text-[11.5px] text-neutral-500">вне рейтинга</span>
          </span>
        ),
    },
    {
      id: 'b',
      label: 'Соперник',
      render: (m) => (
        <span className={m.winner === m.player2.id ? 'font-semibold' : ''}>
          <MatchPlayer person={m.player2} />
        </span>
      ),
    },
    ...(s.canManual
      ? [
          {
            id: 'remove',
            label: '',
            align: 'right' as const,
            className: 'w-14',
            render: (m: ManualMatch) => (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Убрать матч"
                className="rounded-xl"
                onPress={() => void run(() => removeManualMatch(tournamentId, m.id))}
              >
                <Trash2 size={15} />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white" data-testid="schedule" data-status="none" data-mode="manual">
      {error && (
        <p className="px-6 pt-3 text-[13px] text-red-600" data-testid="manual-error">
          {error}
        </p>
      )}
      {finished && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-200 px-6 py-3 max-md:px-4">
          <Chip size="sm" variant="soft" color="success" data-testid="manual-finished">
            Завершён
          </Chip>
          {s.canUnfinish && <Unfinish s={s} onUnfinish={() => void run(() => unfinishManualResults(tournamentId))} />}
          <div className="ml-auto">
            <Segmented
              items={['Рейтинг', 'Матчи']}
              value={view}
              onPick={(v) => setView(v as 'Рейтинг' | 'Матчи')}
              ariaLabel="Вид"
            />
          </div>
        </div>
      )}
      {finished && view === 'Рейтинг' ? (
        <DataTable
          ariaLabel="Изменение рейтинга"
          testId="manual-rating"
          rows={s.ratingChanges}
          columns={RATING_COLUMNS}
          getId={(c) => c.player.id}
          defaultSort={{ column: 'delta', direction: 'descending' }}
          pageSize={50}
          empty="Турнир не рейтинговый — рейтинг не менялся"
          rowProps={(c) => ({
            'data-testid': 'rating-change',
            'data-player': c.player.name,
          })}
        />
      ) : (
        <DataTable
          ariaLabel="Матчи"
          testId="manual-matches"
          rows={s.manualMatches}
          columns={columns}
          getId={(m) => String(m.id)}
          search={{
            placeholder: 'Спортсмен',
            text: (m) => m.player1.name + ' ' + m.player2.name,
          }}
          pageSize={50}
          empty="Матчей нет"
          rowProps={(m) => ({
            'data-testid': 'manual-row',
            'data-a': m.player1.name,
            'data-b': m.player2.name,
          })}
          actions={
            s.canManual && (
              <>
                {s.manualMatches.length === 0 && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="rounded-xl"
                    onPress={() => void run(() => setManualResults(tournamentId, false))}
                    data-testid="manual-cancel"
                  >
                    <Undo2 size={15} /> Сменить способ
                  </Button>
                )}
                <AddMatch s={s} tournamentId={tournamentId} onSaved={onChange} />
                {s.canFinish && <Finish s={s} onFinish={() => void run(() => finishManualResults(tournamentId))} />}
              </>
            )
          }
        />
      )}
    </div>
  );
}
