'use client';

/* Карта Казахстана точками ✳ (23.11.2026, решения владельца продукта; образец —
   карта маршрутов «Truck&Co»): место турнира выбирают щелчком по городу.

   Точки — компонент Dotted Map из Magic UI (`shared/ui/DottedMap`, библиотека
   `svg-dotted-map`) с одной страной — `KAZ`. Города — центры регионов из
   справочника мест (`GET /api/tournaments/places/`): три республиканского
   значения и семнадцать областных центров; их координаты — наши. Город —
   маркер карты; щелчок по нему сохраняет место. Выбранный — цвета бренда с
   пульсом и подписью, наведение — подпись. */

import { useState } from 'react';

import { DottedMap } from '@/shared/ui/DottedMap';

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

const W = 200;
const H = 104;

type CityMarker = { lat: number; lng: number; size: number; pulse: boolean; city: string; region: string };

function Label({ x, y, text, strong }: { x: number; y: number; text: string; strong?: boolean }) {
  const w = text.length * 2.05 + 5;
  return (
    <g transform={`translate(${x + 2.4} ${y - 8})`} className="pointer-events-none">
      <rect width={w} height={6.2} rx={3.1} className={strong ? 'fill-brand-600' : 'fill-white stroke-neutral-200'} strokeWidth={0.25} />
      <text x={2.5} y={4.3} className={'text-[3.4px] font-semibold ' + (strong ? 'fill-white' : 'fill-neutral-800')}>
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
  const selected = KZ_CITIES.find((c) => c.city === (city || region));
  const markers: CityMarker[] = KZ_CITIES.map((c) => ({
    lat: c.lat,
    lng: c.lon,
    size: c === selected ? 1.5 : 1.05,
    pulse: c === selected,
    city: c.city,
    region: c.region,
  }));

  return (
    <div className="h-full w-full" role="group" aria-label="Карта: место турнира" data-testid="kz-map">
      <DottedMap<CityMarker>
        width={W}
        height={H}
        mapSamples={4200}
        countries={['KAZ']}
        region={{ lat: { min: 40, max: 56.4 }, lng: { min: 45.6, max: 88 } }}
        dotRadius={0.55}
        dotColor="var(--color-neutral-300)"
        markerColor="var(--color-neutral-800)"
        markers={markers}
        renderMarkerOverlay={({ marker, x, y }) => {
          const on = marker.city === selected?.city;
          const pick = () => !disabled && onPick?.({ region: marker.region, city: marker.city });
          return (
            <g
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={marker.city}
              aria-pressed={on}
              data-testid="kz-city"
              data-city={marker.city}
              className={disabled ? '' : 'cursor-pointer outline-none'}
              onMouseEnter={() => setHover(marker.city)}
              onMouseLeave={() => setHover(null)}
              onClick={pick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') pick();
              }}
            >
              {on && <circle cx={x} cy={y} r={1.5} className="fill-brand-600 stroke-white" strokeWidth={0.5} />}
              <circle cx={x} cy={y} r={3.2} className="fill-transparent" />
              {(on || hover === marker.city) && <Label x={x} y={y} text={marker.city} strong={on} />}
            </g>
          );
        }}
      />
    </div>
  );
}
