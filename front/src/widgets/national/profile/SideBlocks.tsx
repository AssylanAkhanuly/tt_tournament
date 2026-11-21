'use client';

/* Правая колонка профиля ✳ (22.11.2026, решения владельца продукта):

   - **Личные встречи** (на месте «Ближайшего старта», решение владельца
     продукта 22.11.2026) — с кем спортсмен играл: соперник фамилией с
     инициалами, общий счёт личных встреч (победы : поражения, ведущий —
     зелёным, уступающий — коралловым) и три последних матча с ним — счётом
     на плашке цвета исхода. Соперники — по последней встрече, не больше
     пяти. Источник — рейтинговые матчи истории карточки (неотменённые);
     других матчей система не знает.
   - **Медкарта** — допуск полосой цвета состояния: зелёная — допущен (и до
     какого числа), персиковая — истекает в ближайшие 30 дней (**порог наш**),
     коралловая — истёк, серая — не внесён; ограничения и «Открыть медкарту».
   - **Спортивная карточка** — «Открыть» (психологу). */

import { Button } from '@heroui/react';
import type { ReactNode } from 'react';

import { dmy, type NationalMember } from '@/entities/national';
import type { RatingEntry } from '@/entities/rating';
import { shortName } from '@/shared/lib/name';

import { daysUntil, daysWord, SectionHead } from './ui';

const EXPIRING_DAYS = 30; // за сколько дней предупреждать об окончании допуска — значение наше

function Block({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <section className="flex flex-col border-b border-neutral-200 px-6 py-6 last:border-b-0" data-testid={testId}>
      <SectionHead title={title} />
      {children}
    </section>
  );
}

type Meeting = { id: number; won: boolean; score: string; at: string };
type Rival = { key: string; name: string; wins: number; losses: number; last: Meeting[] };

/** Соперники по рейтинговым матчам: `history` — от старых к новым. */
function rivals(history: RatingEntry[]): Rival[] {
  const by = new Map<string, Rival>();
  for (const h of history) {
    if (h.kind !== 'match' || !h.opponentName) continue;
    const key = h.opponent ?? h.opponentName;
    const r = by.get(key) ?? { key, name: h.opponentName, wins: 0, losses: 0, last: [] };
    if (h.won) r.wins += 1;
    else r.losses += 1;
    r.last = [{ id: h.id, won: !!h.won, score: h.score, at: h.occurredAt }, ...r.last].slice(0, 3);
    by.set(key, r);
  }
  // Порядок соперников — по последней встрече: её место в истории.
  const pos = new Map<string, number>();
  history.forEach((h, n) => {
    if (h.kind === 'match' && h.opponentName) pos.set(h.opponent ?? h.opponentName, n);
  });
  return [...by.values()].sort((a, b) => pos.get(b.key)! - pos.get(a.key)!).slice(0, 5);
}

export function HeadToHead({ history }: { history: RatingEntry[] | null }) {
  const list = history ? rivals(history) : [];
  return (
    <Block title="Личные встречи" testId="profile-h2h">
      {!history ? null : list.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">Встреч нет</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {list.map((r) => {
            const lead = r.wins > r.losses ? 'text-green-700' : r.wins < r.losses ? 'text-[color-mix(in_srgb,var(--color-qtt-coral)_75%,black)]' : 'text-neutral-700';
            return (
              <li key={r.key} className="flex items-center gap-3 border-b border-neutral-100 py-2.5 last:border-b-0" data-testid="h2h-row" data-name={r.name}>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium" title={r.name}>
                  {shortName(r.name)}
                </span>
                <span className="flex gap-1" aria-label="Последние встречи">
                  {r.last.map((m) => (
                    <span
                      key={m.id}
                      title={dmy(m.at.slice(0, 10))}
                      className={
                        'rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums ' +
                        (m.won ? 'bg-green-50 text-green-700' : 'bg-[color-mix(in_srgb,var(--color-qtt-coral)_10%,white)] text-[color-mix(in_srgb,var(--color-qtt-coral)_75%,black)]')
                      }
                      data-testid="h2h-game"
                      data-won={m.won ? 'yes' : 'no'}
                    >
                      {m.score}
                    </span>
                  ))}
                </span>
                <span className={'w-12 text-right text-[16px] font-semibold tabular-nums ' + lead} data-testid="h2h-score">
                  {r.wins}:{r.losses}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Block>
  );
}

export function MedStatus({ member, onOpenMedical }: { member: NationalMember; onOpenMedical: () => void }) {
  const { status, until } = member.clearance;
  const left = status === 'ok' && until ? daysUntil(until) : null;
  const tone =
    status === 'expired'
      ? { band: 'bg-[color-mix(in_srgb,var(--color-qtt-coral)_12%,white)] text-[color-mix(in_srgb,var(--color-qtt-coral)_70%,black)]', title: 'Допуск истёк', sub: dmy(until) }
      : status === 'none'
        ? { band: 'bg-neutral-100 text-neutral-600', title: 'Допуск не внесён', sub: '' }
        : left !== null && left <= EXPIRING_DAYS
          ? { band: 'bg-[color-mix(in_srgb,var(--color-qtt-peach)_20%,white)] text-[color-mix(in_srgb,var(--color-qtt-peach)_60%,black)]', title: 'Допуск истекает', sub: 'до ' + dmy(until) + ' · через ' + daysWord(left) }
          : { band: 'bg-green-50 text-green-800', title: 'Допущен', sub: 'до ' + dmy(until) + (left !== null ? ' · ещё ' + daysWord(left) : '') };
  return (
    <Block title="Медкарта" testId="profile-medical">
      <div className={'flex flex-col gap-0.5 rounded-xl px-4 py-3.5 ' + tone.band} data-testid="clearance" data-status={status}>
        <span className="text-[17px] font-semibold">{tone.title}</span>
        {tone.sub && <span className="text-[13px] opacity-80">{tone.sub}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[14px]">
        <span className="text-neutral-500">Ограничения нагрузки</span>
        <span className="font-medium tabular-nums" data-testid="profile-limits">
          {member.limits || 'Нет'}
        </span>
      </div>
      <Button className="mt-5 w-full rounded-xl" onPress={onOpenMedical} data-testid="profile-medical-open">
        Открыть медкарту
      </Button>
    </Block>
  );
}

export function SportLink({ onOpen }: { onOpen: () => void }) {
  return (
    <Block title="Спортивная карточка" testId="profile-sport">
      <Button className="w-full rounded-xl" onPress={onOpen} data-testid="profile-sport-open">
        Открыть
      </Button>
    </Block>
  );
}
