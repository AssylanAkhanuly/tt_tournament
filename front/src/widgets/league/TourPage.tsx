'use client';

/* Тур Евразийской лиги ✳ (19.11.2026, LEAGUE.md): встречи тура таблицей
   (команда A, счёт, команда B), строка открывает окно счёта. В окне —
   расстановка (по `players` игроков из состава каждой стороны: A, B, C против
   X, Y, Z) и личные встречи по порядку из правил; строки после решённой
   встречи неактивны — встреча кончается на `winsNeeded`-й победе. Проверку
   делает сервер (движок), окно лишь не даёт набрать лишнего.
   HeroUI + Tailwind. */

import { Button, Modal } from '@heroui/react';
import { useMemo, useState } from 'react';

import {
  fetchTeamMatch,
  saveNoShow,
  saveResult,
  useLoad,
  type TeamMatch,
  type TeamMatchDetail,
  type TourDetail,
} from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { Picker } from '@/shared/ui/Picker';

const SIDE_A = ['A', 'B', 'C', 'D', 'E'];
const SIDE_B = ['X', 'Y', 'Z', 'U', 'V'];

const score = (m: TeamMatch) =>
  m.status === 'finished' || m.rubbers.length ? m.rubbersA + ' : ' + m.rubbersB + (m.noShow ? ' (неявка)' : '') : '—';

const COLUMNS: DataColumn<TeamMatch>[] = [
  { id: 'a', label: 'Команда', rowHeader: true, sortable: false, render: (m) => <span className={m.winner === 'a' ? 'font-semibold' : ''}>{m.teamA.name}</span> },
  { id: 'score', label: 'Счёт', sortable: false, render: (m) => <span className="tabular-nums">{score(m)}</span> },
  { id: 'b', label: 'Соперник', sortable: false, render: (m) => <span className={m.winner === 'b' ? 'font-semibold' : ''}>{m.teamB.name}</span> },
  { id: 'status', label: 'Статус', sortable: false, render: (m) => (m.status === 'finished' ? 'Завершена' : 'Ожидает') },
];

function ResultForm({ match, canEdit, onSaved }: { match: TeamMatchDetail; canEdit: boolean; onSaved: () => void }) {
  const n = match.rules.players;
  const [lineupA, setLineupA] = useState<string[]>(() => (match.lineupA.length ? match.lineupA : Array(n).fill('')));
  const [lineupB, setLineupB] = useState<string[]>(() => (match.lineupB.length ? match.lineupB : Array(n).fill('')));
  const [rubbers, setRubbers] = useState<([number, number] | null)[]>(() =>
    match.order.map((_, i) => (match.rubbers[i] ? [match.rubbers[i][0], match.rubbers[i][1]] : null)),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const g = match.rules.gamesToWin;

  // Сколько побед у сторон по уже набранным встречам и где встреча решена.
  const decidedAt = useMemo(() => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < rubbers.length; i++) {
      const r = rubbers[i];
      if (!r) return null;
      if (r[0] > r[1]) a++;
      else b++;
      if (a === match.rules.winsNeeded || b === match.rules.winsNeeded) return i;
    }
    return null;
  }, [rubbers, match.rules.winsNeeded]);

  const name = (list: { id: string; name: string }[], id: string) => list.find((p) => p.id === id)?.name ?? '—';
  const scoreOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [{ id: '', label: '—' }];
    for (let lo = 0; lo < g; lo++) {
      opts.push({ id: g + ':' + lo, label: g + ' : ' + lo });
      opts.push({ id: lo + ':' + g, label: lo + ' : ' + g });
    }
    return opts;
  }, [g]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const played = rubbers.slice(0, decidedAt === null ? rubbers.length : decidedAt + 1).filter((r): r is [number, number] => !!r);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { team: match.teamA, squad: match.squadA, lineup: lineupA, set: setLineupA, letters: SIDE_A, side: 'a' },
          { team: match.teamB, squad: match.squadB, lineup: lineupB, set: setLineupB, letters: SIDE_B, side: 'b' },
        ].map(({ team, squad, lineup, set, letters, side }) => (
          <section key={side} className="flex flex-col gap-2" data-testid={'lineup-' + side}>
            <h3 className="m-0 text-[13px] font-semibold">{team.name}</h3>
            {lineup.map((id, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-[13px] font-semibold text-neutral-500">{letters[i]}</span>
                <Picker
                  label={team.name + ' — ' + letters[i]}
                  value={id || null}
                  placeholder="Игрок"
                  isDisabled={!canEdit}
                  options={squad.map((p) => ({ id: p.id, label: p.name, isDisabled: lineup.includes(p.id) && p.id !== id }))}
                  onChange={(v) => set(lineup.map((x, j) => (j === i ? v : x)))}
                  testId={'lineup-' + side + '-' + i}
                />
              </div>
            ))}
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-1.5" data-testid="rubbers">
        <h3 className="m-0 text-[13px] font-semibold">Личные встречи</h3>
        {match.order.map(([ia, ib], i) => {
          const off = decidedAt !== null && i > decidedAt;
          const r = rubbers[i];
          return (
            <div key={i} className={'flex items-center gap-3 ' + (off ? 'opacity-40' : '')} data-testid="rubber-row">
              <span className="w-6 text-[12px] text-neutral-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {SIDE_A[ia]} {name(match.squadA, lineupA[ia])} — {SIDE_B[ib]} {name(match.squadB, lineupB[ib])}
              </span>
              <Picker
                label={'Счёт встречи ' + (i + 1)}
                className="w-28 min-w-0"
                value={r ? r[0] + ':' + r[1] : ''}
                options={scoreOptions}
                isDisabled={!canEdit || off}
                onChange={(v) =>
                  setRubbers(rubbers.map((x, j) => (j === i ? (v ? (v.split(':').map(Number) as [number, number]) : null) : x)))
                }
                testId={'rubber-' + i}
              />
            </div>
          );
        })}
      </section>

      {error && <p className="m-0 text-[13px] text-red-600" data-testid="result-error">{error}</p>}

      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="tertiary" className="rounded-xl" isDisabled={busy} onPress={() => void run(() => saveNoShow(match.id, 'a'))} data-testid="no-show-a">
            Неявка: {match.teamA.name}
          </Button>
          <Button variant="tertiary" className="rounded-xl" isDisabled={busy} onPress={() => void run(() => saveNoShow(match.id, 'b'))} data-testid="no-show-b">
            Неявка: {match.teamB.name}
          </Button>
          <Button
            variant="primary"
            className="rounded-xl"
            isDisabled={busy}
            onPress={() => void run(() => saveResult(match.id, lineupA, lineupB, played))}
            data-testid="result-save"
          >
            Сохранить
          </Button>
        </div>
      )}
    </div>
  );
}

function MatchDialog({ matchId, canEdit, onClose, onSaved }: { matchId: number | null; canEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const detail = useLoad(() => (matchId ? fetchTeamMatch(matchId) : Promise.resolve(null)), String(matchId));
  const m = detail.data;
  return (
    <Modal.Backdrop isOpen={matchId !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog className="rounded-xl" data-testid="match-dialog">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading className="text-lg font-semibold">
              {m ? m.teamA.name + ' — ' + m.teamB.name : 'Встреча'}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {m && (
              <ResultForm
                key={m.id + ':' + m.status + ':' + m.rubbers.length}
                match={m}
                canEdit={canEdit}
                onSaved={() => {
                  onSaved();
                  onClose();
                }}
              />
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function TourPage({ tour, canEdit, onChanged }: { tour: TourDetail; canEdit: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <DataTable
        ariaLabel={'Встречи тура ' + tour.number}
        testId="tour-matches"
        rows={tour.matches}
        columns={COLUMNS}
        getId={(m) => String(m.id)}
        empty="Встреч нет"
        onRowAction={(m) => setOpen(m.id)}
        rowProps={(m) => ({ 'data-testid': 'match-row', 'data-match': m.teamA.name + ' — ' + m.teamB.name })}
      />
      <MatchDialog matchId={open} canEdit={canEdit} onClose={() => setOpen(null)} onSaved={onChanged} />
    </>
  );
}
