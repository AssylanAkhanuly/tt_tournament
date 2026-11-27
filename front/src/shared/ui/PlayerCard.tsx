'use client';

/* Карточка спортсмена — одна на приложение ✳ (24.11.2026, решение владельца
   продукта: «карточки одинаковые по всему приложению, компонентом»). Ею рисуют
   рейтинг-лист карточками (`RatingPlayerCard`), состав турнира, «Лучших по
   рейтингу» обзора и состав сборной (`RosterBoard`).

   Устройство: слева фигура (снимок или заглушка своего пола), справа место в
   листе огромной контурной цифрой фоном, фамилия, имя, регион и строка
   показателей. Подложка — один градиент на всю карточку, фигура стоит на нём же
   (прежняя персиковая колонка снята): серо-белый, у выбранной — лёгкий голубой
   бренда с голубой рамкой; текст тёмный в
   обоих состояниях. Что показывать в строке показателей и в углу (значок
   допуска) — решает вызывающий. */

import type { ReactNode } from 'react';

export type PlayerCardFact = { label: string; value: ReactNode; testId?: string };

const BASE = 'group relative flex h-36 min-w-0 overflow-hidden rounded-2xl border text-left transition-[box-shadow,border-color,background] ';
// Лёгкий голубой градиент бренда — и в покое ✳ (27.11.2026, решение владельца
// продукта: «голубой градиент по умолчанию, как раньше»); наведение — рамка и тень.
const IDLE = 'border-brand-100 bg-[linear-gradient(120deg,var(--color-brand-100),white_75%)] hover:border-brand-200 hover:shadow-md';
const ON = 'border-brand-300 bg-[linear-gradient(120deg,var(--color-brand-200),white_75%)] shadow-md shadow-brand-500/10';

export function PlayerCard({
  figure,
  place,
  surname,
  rest,
  region,
  facts,
  selected,
  corner,
  onPress,
  onDoubleClick,
  testId,
  data,
  placeTestId,
}: {
  /** Фигура — `<img>` или своя разметка; кладётся в левую колонку целиком. */
  figure: ReactNode;
  /** Место в листе — контурной цифрой фоном; нет — без цифры. */
  place?: number | null;
  surname: string;
  rest: string;
  region: string;
  facts: PlayerCardFact[];
  /** Выбрана (панель справа показывает её) — `aria-pressed` и голубой градиент. */
  selected?: boolean;
  /** Значок в левом верхнем углу (допуск сборной). */
  corner?: ReactNode;
  onPress: () => void;
  onDoubleClick?: () => void;
  testId: string;
  /** `data-*` для проверок: `{ player: 'Иванов Иван' }` → `data-player`. */
  data?: Record<string, string>;
  placeTestId?: string;
}) {
  const dataAttrs = Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => ['data-' + k, v]));
  return (
    <button
      type="button"
      onClick={onPress}
      onDoubleClick={onDoubleClick}
      aria-pressed={selected}
      className={BASE + (selected ? ON : IDLE)}
      data-testid={testId}
      {...dataAttrs}
    >
      <span className="relative w-28 shrink-0 overflow-hidden">{figure}</span>
      {corner && <span className="absolute top-2.5 left-2.5">{corner}</span>}
      {place ? (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-28 flex items-center justify-end overflow-hidden pr-3">
          <span
            className={
              'font-[family-name:var(--font-jersey)] text-[180px] leading-[0.72] tracking-tight text-transparent tabular-nums select-none ' +
              (selected
                ? '[-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--color-brand-300)_60%,transparent)]'
                : '[-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--color-neutral-200)_80%,transparent)]')
            }
            data-testid={placeTestId}
          >
            {place}
          </span>
        </span>
      ) : null}
      <span className="relative flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <span className="truncate text-[16px] leading-tight font-bold">{surname}</span>
        <span className="truncate text-[13px] text-neutral-500">{rest}</span>
        <span className="truncate text-[12px] text-neutral-400">{region || 'Регион не указан'}</span>
        <span className="mt-2.5 flex gap-x-4">
          {facts.map((f) => (
            <span key={f.label} className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">{f.label}</span>
              <span className="text-[12.5px] font-medium whitespace-nowrap tabular-nums" data-testid={f.testId}>
                {f.value}
              </span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/** Заглушка-фигура или снимок по пояс в левой колонке карточки. */
export function PlayerFigure({ src, photo = false, testId }: { src: string; photo?: boolean; testId?: string }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="absolute inset-0 size-full object-cover object-top" data-testid={testId} data-photo="yes" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className="absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none origin-bottom -translate-x-1/2 transition-transform duration-300 group-hover:scale-[1.04]"
      data-testid={testId}
      data-photo="no"
    />
  );
}
