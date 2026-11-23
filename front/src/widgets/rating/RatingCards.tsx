'use client';

/* Рейтинг-лист карточками ✳ (23.11.2026, решение владельца продукта: «как у
   тренера сборной»). Карточка — как в составе сборной (`RosterBoard`): слева
   фигура на персиковом (снимков у рейтинга нет — заглушка своего пола), справа
   место в листе огромной контурной цифрой фоном, фамилия, имя и отчество,
   регион; внизу — рейтинг и год рождения. Нажатие открывает карточку
   спортсмена. Сетка: одна колонка на телефоне, две — от `sm`, три — от `2xl`. */

import type { RatingProfile } from '@/entities/rating';
import { num2 } from '@/entities/rating';
import { placeholderFigure } from '@/shared/lib/figure';

function split(name: string): { surname: string; rest: string } {
  const [surname = '', ...rest] = name.trim().split(/\s+/);
  return { surname: surname.toUpperCase(), rest: rest.join(' ') };
}

function RatingCard({ r, place, onOpen }: { r: RatingProfile; place: number; onOpen: () => void }) {
  const { surname, rest } = split(r.name);
  const facts: [string, string][] = [
    ['Рейтинг', num2(r.value)],
    ['Год', r.birthYear ? String(r.birthYear) : '—'],
  ];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex h-36 min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white text-left hover:border-brand-200 hover:shadow-md"
      data-testid="rating-card"
      data-player={r.name}
    >
      <span className="relative w-28 shrink-0 overflow-hidden bg-qtt-peach">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={placeholderFigure(r.userId, r.sex)} alt="" loading="lazy" className="absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-28 flex items-center justify-end overflow-hidden pr-3">
        <span className="font-[family-name:var(--font-jersey)] text-[180px] leading-[0.72] tracking-tight text-transparent tabular-nums select-none [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--color-neutral-200)_80%,transparent)]">
          {place}
        </span>
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <span className="truncate text-[16px] leading-tight font-bold">{surname}</span>
        <span className="truncate text-[13px] text-neutral-500">{rest}</span>
        <span className="truncate text-[12px] text-neutral-400">{r.region || 'Регион не указан'}</span>
        <span className="mt-2.5 flex gap-x-4">
          {facts.map(([label, value]) => (
            <span key={label} className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">{label}</span>
              <span className="text-[12.5px] font-medium whitespace-nowrap tabular-nums" data-testid={label === 'Рейтинг' ? 'rating-value' : undefined}>
                {value}
              </span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export function RatingCards({ rows, first, onOpen }: { rows: RatingProfile[]; first: number; onOpen: (userId: string) => void }) {
  return (
    <div className="grid gap-4 bg-neutral-100 p-4 sm:grid-cols-2 2xl:grid-cols-3" data-testid="rating-cards">
      {rows.map((r, i) => (
        <RatingCard key={r.userId} r={r} place={first + i + 1} onOpen={() => onOpen(r.userId)} />
      ))}
    </div>
  );
}
