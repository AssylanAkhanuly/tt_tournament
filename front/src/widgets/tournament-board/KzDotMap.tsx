'use client';

/* Карта Казахстана точками ✳ (23.11.2026, решение владельца продукта; образец —
   карта маршрутов «Truck&Co»): место турнира выбирают щелчком по городу.

   Контур — упрощённый, ~90 вершин по долготе и широте (наш, для узнаваемой
   формы, не для границ); проекция равнопромежуточная с поправкой на 48° с. ш.
   Точки фона — решётка внутри контура. Города — центры регионов из
   справочника мест (`GET /api/tournaments/places/`): три республиканского
   значения и семнадцать областных центров; их координаты — наши. Выбранный —
   метка цвета бренда с подписью, наведение — подпись. */

import { useMemo, useState } from 'react';

type Pt = [number, number];

const OUTLINE: Pt[] = [
  [46.7, 48.5], [47.1, 49.1], [46.8, 49.4], [47.4, 50.1], [48.6, 50.6], [48.7, 51.5], [50.0, 51.6], [50.8, 51.6],
  [52.2, 51.6], [53.5, 51.4], [55.5, 50.7], [56.5, 51.0], [57.5, 50.9], [58.6, 51.0], [59.6, 50.5], [61.4, 50.8],
  [61.6, 51.3], [60.0, 52.0], [61.0, 52.4], [60.8, 52.8], [61.7, 53.0], [61.0, 53.6], [61.3, 54.0], [63.0, 54.1],
  [65.2, 54.4], [65.5, 55.0], [67.0, 54.9], [68.2, 55.3], [69.0, 55.4], [70.8, 55.3], [71.2, 54.6], [71.1, 54.1],
  [72.2, 54.2], [73.4, 54.0], [73.6, 53.6], [74.8, 53.8], [76.3, 54.3], [76.7, 53.9], [77.9, 53.3], [79.0, 52.0],
  [80.0, 50.9], [80.7, 51.4], [81.5, 51.0], [83.4, 51.0], [84.2, 50.4], [85.0, 49.9], [86.2, 49.6], [86.8, 49.8],
  [87.3, 49.1], [86.6, 48.6], [85.8, 48.4], [85.5, 47.1], [84.0, 46.9], [82.9, 47.0], [82.3, 45.5], [80.0, 45.0],
  [79.9, 44.6], [80.4, 43.9], [80.8, 43.2], [80.2, 42.9], [79.1, 42.8], [77.6, 42.9], [76.0, 42.9], [75.0, 42.6],
  [74.2, 43.2], [73.5, 42.5], [72.8, 42.6], [71.8, 42.8], [71.2, 42.6], [70.8, 42.2], [70.0, 41.5], [68.6, 40.6],
  [68.0, 41.1], [67.0, 41.2], [66.6, 41.2], [66.5, 42.0], [65.8, 42.9], [64.9, 43.7], [62.0, 43.5], [61.0, 44.4],
  [58.6, 45.6], [56.0, 45.0], [56.0, 41.4], [54.2, 41.6], [53.0, 42.1], [52.4, 42.4], [51.3, 43.2], [51.1, 44.2],
  [50.3, 44.6], [51.4, 45.3], [53.1, 46.6], [51.5, 46.9], [49.2, 46.3], [48.5, 46.7], [48.0, 47.7],
];

/** Города на карте: регион и город — как в справочнике мест сервера. */
export const KZ_CITIES: { region: string; city: string; lon: number; lat: number }[] = [
  { region: 'Астана', city: 'Астана', lon: 71.45, lat: 51.17 },
  { region: 'Алматы', city: 'Алматы', lon: 76.89, lat: 43.24 },
  { region: 'Шымкент', city: 'Шымкент', lon: 69.59, lat: 42.32 },
  { region: 'Абайская область', city: 'Семей', lon: 80.25, lat: 50.41 },
  { region: 'Акмолинская область', city: 'Кокшетау', lon: 69.39, lat: 53.28 },
  { region: 'Актюбинская область', city: 'Актобе', lon: 57.17, lat: 50.28 },
  { region: 'Алматинская область', city: 'Конаев', lon: 77.07, lat: 43.87 },
  { region: 'Атырауская область', city: 'Атырау', lon: 51.92, lat: 47.11 },
  { region: 'Восточно-Казахстанская область', city: 'Усть-Каменогорск', lon: 82.61, lat: 49.95 },
  { region: 'Жамбылская область', city: 'Тараз', lon: 71.37, lat: 42.9 },
  { region: 'Жетысуская область', city: 'Талдыкорган', lon: 78.37, lat: 45.02 },
  { region: 'Западно-Казахстанская область', city: 'Уральск', lon: 51.37, lat: 51.23 },
  { region: 'Карагандинская область', city: 'Караганда', lon: 73.1, lat: 49.8 },
  { region: 'Костанайская область', city: 'Костанай', lon: 63.62, lat: 53.21 },
  { region: 'Кызылординская область', city: 'Кызылорда', lon: 65.5, lat: 44.85 },
  { region: 'Мангистауская область', city: 'Актау', lon: 51.2, lat: 43.65 },
  { region: 'Павлодарская область', city: 'Павлодар', lon: 76.95, lat: 52.29 },
  { region: 'Северо-Казахстанская область', city: 'Петропавловск', lon: 69.14, lat: 54.87 },
  { region: 'Туркестанская область', city: 'Туркестан', lon: 68.25, lat: 43.3 },
  { region: 'Улытауская область', city: 'Жезказган', lon: 67.71, lat: 47.8 },
];

const LON0 = 46;
const LAT1 = 55.6;
const PX = 24; // точек экрана на градус долготы
const PY = PX / Math.cos((48 * Math.PI) / 180);
const W = Math.round((87.6 - LON0) * PX);
const H = Math.round((LAT1 - 40.4) * PY);
const STEP = 15;

const x = (lon: number) => (lon - LON0) * PX;
const y = (lat: number) => (LAT1 - lat) * PY;

function inside([px, py]: Pt, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function Label({ cx, cy, text, strong }: { cx: number; cy: number; text: string; strong?: boolean }) {
  const w = text.length * 11 + 26;
  return (
    <g transform={`translate(${cx + 14} ${cy - 44})`} className="pointer-events-none">
      <rect width={w} height={36} rx={18} className={strong ? 'fill-brand-600' : 'fill-white'} filter="url(#kz-shadow)" />
      <text x={13} y={24} className={'text-[19px] font-semibold ' + (strong ? 'fill-white' : 'fill-neutral-800')}>
        {text}
      </text>
    </g>
  );
}

export function KzDotMap({ region, city, onPick, disabled }: {
  region: string;
  city: string;
  onPick?: (place: { region: string; city: string }) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const dots = useMemo(() => {
    const out: Pt[] = [];
    for (let py = STEP / 2; py < H; py += STEP)
      for (let px = STEP / 2; px < W; px += STEP) {
        const lon = px / PX + LON0;
        const lat = LAT1 - py / PY;
        if (inside([lon, lat], OUTLINE)) out.push([px, py]);
      }
    return out;
  }, []);
  const selected = KZ_CITIES.find((c) => c.city === (city || region));

  return (
    <svg viewBox={`-10 -30 ${W + 20} ${H + 40}`} className="h-full w-full" role="group" aria-label="Карта: место турнира" data-testid="kz-map">
      <defs>
        <filter id="kz-shadow" x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.15" />
        </filter>
      </defs>
      {dots.map(([px, py]) => (
        <circle key={px + ':' + py} cx={px} cy={py} r={4} className="fill-neutral-300" />
      ))}
      {KZ_CITIES.map((c) => {
        const on = c === selected;
        const cx = x(c.lon);
        const cy = y(c.lat);
        return (
          <g
            key={c.city}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={c.city}
            aria-pressed={on}
            data-testid="kz-city"
            data-city={c.city}
            className={disabled ? '' : 'cursor-pointer outline-none'}
            onMouseEnter={() => setHover(c.city)}
            onMouseLeave={() => setHover(null)}
            onClick={() => !disabled && onPick?.({ region: c.region, city: c.city })}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) onPick?.({ region: c.region, city: c.city });
            }}
          >
            <circle cx={cx} cy={cy} r={20} className="fill-transparent" />
            {on && <circle cx={cx} cy={cy} r={20} className="fill-brand-500/25" />}
            <circle cx={cx} cy={cy} r={on ? 11 : 8} className={on ? 'fill-brand-600 stroke-white' : 'fill-neutral-800 stroke-white'} strokeWidth={3} />
          </g>
        );
      })}
      {selected && <Label cx={x(selected.lon)} cy={y(selected.lat)} text={selected.city} strong />}
      {hover && hover !== selected?.city && (() => {
        const c = KZ_CITIES.find((k) => k.city === hover)!;
        return <Label cx={x(c.lon)} cy={y(c.lat)} text={c.city} />;
      })()}
    </svg>
  );
}
