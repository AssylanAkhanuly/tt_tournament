// Полоса партнёров — вторая вещательная плашка: знаки в ряд через тонкие
// линии, без подложки, поверх видео. Чистая отрисовка, как и плашка счёта.
//
// Размеры — от той же `--sb-unit`, что и у плашки счёта: обе масштабируются
// одной переменной. Шаг Tailwind `--spacing` внутри полосы равен единице, как и
// в плашке: `h-100` — 100 единиц.

import type { CSSProperties } from 'react';

import { SB_FONT } from './ScoreboardBoard';
import { SPONSORS, type Sponsor } from './sponsors';

/** Размер источника «Браузер» в OBS под полный набор партнёров с подписью.
 *  Полоса занимает столько, сколько ей нужно; остаток источника прозрачный. */
export const SPONSOR_STRIP_SIZE = { width: 1400, height: 100 } as const;

/** Разделители — тонкие линии между соседями, как в вещательных плашках.
 *  Линия одной высоты у всех (52 единицы), а не по росту знака: иначе ряд
 *  выглядит рваным. Отступ 22 единицы по обе стороны линии. */
const SEPARATOR =
  '[&>*+*]:box-content [&>*+*]:ml-22 [&>*+*]:pl-22 ' +
  '[&>*+*]:[background:linear-gradient(color-mix(in_srgb,var(--sb-ink)_70%,transparent),color-mix(in_srgb,var(--sb-ink)_70%,transparent))_left_center/--spacing(2)_--spacing(52)_no-repeat]';

export function SponsorStrip({
  label,
  sponsors = SPONSORS,
}: {
  /** Подпись перед знаками — город или название турнира. */
  label?: string;
  sponsors?: readonly Sponsor[];
}) {
  return (
    <div
      className={
        '[--sb-unit:var(--sb-scale,1px)] [--spacing:var(--sb-unit)] ' +
        `inline-flex h-100 items-center px-10 text-sb-ink ${SB_FONT} font-extrabold leading-none whitespace-nowrap ` +
        /* Подложки нет, поэтому на светлом кадре знаки держит тень: без неё
           белый на белом столе или форме пропадает. */
        '[filter:drop-shadow(0_--spacing(1)_--spacing(3)_color-mix(in_srgb,var(--sb-navy)_70%,transparent))] ' +
        SEPARATOR
      }
      data-testid="sponsors"
    >
      {label ? (
        <span className="text-[length:--spacing(34)] tracking-[0.02em] uppercase" data-testid="sponsors-label">
          {label}
        </span>
      ) : null}
      {sponsors.map((sponsor) => (
        // Обычный <img>: знаки лежат готовыми в public, а оптимизатор картинок
        // Next источнику в OBS ничего не даёт.
        // Высота у каждого знака своя (оптическая, задана в sponsors.ts).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={sponsor.id}
          className="block h-[calc(var(--sp-h)*var(--sb-unit))] w-auto flex-none"
          src={`/sponsors/${sponsor.id}.png`}
          alt={sponsor.name}
          data-testid={`sponsor-${sponsor.id}`}
          style={{ '--sp-h': sponsor.height } as CSSProperties}
        />
      ))}
    </div>
  );
}
