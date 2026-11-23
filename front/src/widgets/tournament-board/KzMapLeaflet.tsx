'use client';

/* Карта места турнира на Leaflet ✳ (23.11.2026, решение владельца продукта:
   «спутник и рельеф, на Leaflet»). Подложка — спутниковые плитки Esri
   (`SATELLITE_URL`; строку источников Leaflet убрали по просьбе владельца
   продукта), поверх — контур Казахстана (`kz-border.json`:
   граница Natural Earth 1:10 млн из пакета `world-atlas`, материк и острова
   Каспия; извлечена один раз, пакета в зависимостях нет) и затемнение всего, что вне его. Города —
   центры регионов (`KZ_CITIES`, координаты наши): метка-кнопка, щелчок
   сохраняет место; выбранный — крупнее, с подписью. Перетаскивать можно,
   колесо мыши карту не приближает — страница прокручивается дальше. */

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, Polygon, TileLayer, Tooltip } from 'react-leaflet';

import border from './kz-border.json';
import { KZ_CITIES, OUTSIDE_DIM, SATELLITE_URL } from './kzMapData';

const KAZ = border as [number, number][][];
const toLatLng = (ring: [number, number][]) => ring.map(([lng, lat]) => [lat, lng] as [number, number]);
const KZ_BOUNDS: L.LatLngBoundsExpression = [
  [40.4, 46.4],
  [55.5, 87.4],
];
// Затемнение вне страны: весь мир внешним кольцом, Казахстан — дырой в нём.
const WORLD: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];

const cityIcon = (city: string, on: boolean) =>
  L.divIcon({
    className: '',
    iconSize: on ? [18, 18] : [12, 12],
    html:
      `<span role="button" aria-label="${city}" aria-pressed="${on}" data-testid="kz-city" data-city="${city}" ` +
      `class="block size-full rounded-full border-2 border-white shadow-md ${on ? 'bg-brand-500' : 'bg-neutral-800'}"></span>`,
  });

export default function KzMapLeaflet({ region, city, onPick, disabled }: {
  region: string;
  city: string;
  onPick?: (place: { region: string; city: string }) => void;
  disabled?: boolean;
}) {
  const selected = KZ_CITIES.find((c) => c.city === (city || region));
  const kz = useMemo(() => KAZ.map(toLatLng), []);

  return (
    <div className="h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-neutral-800" data-testid="kz-map">
      <MapContainer bounds={KZ_BOUNDS} boundsOptions={{ padding: [12, 12] }} scrollWheelZoom={false} attributionControl={false} zoomControl={false} minZoom={3} maxZoom={9}>
        <TileLayer url={SATELLITE_URL} maxNativeZoom={18} />
        <Polygon positions={[WORLD, ...kz]} pathOptions={{ stroke: false, fillOpacity: OUTSIDE_DIM, interactive: false, className: 'fill-neutral-950' }} />
        <Polygon positions={kz} pathOptions={{ weight: 2, fill: false, interactive: false, className: 'stroke-brand-300' }} />
        {KZ_CITIES.map((c) => {
          const on = c === selected;
          return (
            <Marker
              key={c.city + on}
              position={[c.lat, c.lon]}
              icon={cityIcon(c.city, on)}
              zIndexOffset={on ? 1000 : 0}
              eventHandlers={{ click: () => !disabled && onPick?.({ region: c.region, city: c.city }) }}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent={on}>
                {c.city}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
