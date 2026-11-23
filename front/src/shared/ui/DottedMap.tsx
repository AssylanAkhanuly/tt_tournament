'use client';

/* Dotted Map из Magic UI ✳ (23.11.2026, решение владельца продукта:
   «use magic ui dotted map»; исходник — реестр `magicui.design/r/dotted-map.json`,
   поверх библиотеки `svg-dotted-map`). Перенесён как есть, с двумя правками
   под проект: передаются `countries` и `region` библиотеки (карта одной
   страны), классы — без `cn` (его в проекте нет), цвета по умолчанию — токены. */

import * as React from 'react';
import { createMap } from 'svg-dotted-map';

export interface Marker {
  lat: number;
  lng: number;
  size?: number;
  pulse?: boolean;
}

/** addMarkers возвращает маркеры без lat/lng — остаются x, y и прочие поля. */
type MapMarker<M extends Marker> = Omit<M, 'lat' | 'lng'> & { x: number; y: number };

export interface DottedMapProps<M extends Marker = Marker> extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  mapSamples?: number;
  /** Коды стран ISO 3166-1 alpha-3 (`KAZ`) — только их точки. */
  countries?: string[];
  region?: { lat: { min: number; max: number }; lng: { min: number; max: number } };
  markers?: M[];
  dotColor?: string;
  markerColor?: string;
  dotRadius?: number;
  stagger?: boolean;
  pulse?: boolean;
  renderMarkerOverlay?: (args: { marker: MapMarker<M>; index: number; x: number; y: number; r: number }) => React.ReactNode;
}

export function DottedMap<M extends Marker = Marker>({
  width = 150,
  height = 75,
  mapSamples = 5000,
  countries,
  region,
  markers = [],
  dotColor = 'currentColor',
  markerColor = 'var(--color-brand-600)',
  dotRadius = 0.2,
  stagger = true,
  pulse = false,
  renderMarkerOverlay,
  className,
  style,
  ...svgProps
}: DottedMapProps<M>) {
  // Массивы и объекты сравниваются по значению: новый литерал на каждом рендере не пересобирает карту.
  const countriesKey = JSON.stringify(countries ?? null);
  const regionKey = JSON.stringify(region ?? null);
  const { points, addMarkers } = React.useMemo(
    () => createMap({ width, height, mapSamples, countries: JSON.parse(countriesKey) ?? undefined, region: JSON.parse(regionKey) ?? undefined }),
    [width, height, mapSamples, countriesKey, regionKey],
  );
  const processedMarkers = addMarkers(markers) as MapMarker<M>[];

  const { xStep, yToRowIndex } = React.useMemo(() => {
    const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
    const rowMap = new Map<number, number>();
    let step = 0;
    let prevY = Number.NaN;
    let prevXInRow = Number.NaN;
    for (const p of sorted) {
      if (p.y !== prevY) {
        prevY = p.y;
        prevXInRow = Number.NaN;
        if (!rowMap.has(p.y)) rowMap.set(p.y, rowMap.size);
      }
      if (!Number.isNaN(prevXInRow)) {
        const delta = p.x - prevXInRow;
        if (delta > 0) step = step === 0 ? delta : Math.min(step, delta);
      }
      prevXInRow = p.x;
    }
    return { xStep: step || 1, yToRowIndex: rowMap };
  }, [points]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={'text-neutral-300 ' + (className ?? '')} style={{ width: '100%', height: '100%', ...style }} {...svgProps}>
      {points.map((point, index) => {
        const rowIndex = yToRowIndex.get(point.y) ?? 0;
        const offsetX = stagger && rowIndex % 2 === 1 ? xStep / 2 : 0;
        return <circle cx={point.x + offsetX} cy={point.y} r={dotRadius} fill={dotColor} key={`${point.x}-${point.y}-${index}`} />;
      })}

      {processedMarkers.map((marker, index) => {
        const rowIndex = yToRowIndex.get(marker.y) ?? 0;
        const offsetX = stagger && rowIndex % 2 === 1 ? xStep / 2 : 0;
        const x = marker.x + offsetX;
        const y = marker.y;
        const r = marker.size ?? dotRadius;
        const shouldPulse = pulse ? marker.pulse !== false : marker.pulse === true;
        const pulseTo = r * 2.8;
        return (
          <g key={`${marker.x}-${marker.y}-${index}`}>
            <circle cx={x} cy={y} r={r} fill={markerColor} />
            {shouldPulse ? (
              <g pointerEvents="none">
                <circle cx={x} cy={y} r={r} fill="none" stroke={markerColor} strokeOpacity={1} strokeWidth={0.35}>
                  <animate attributeName="r" values={`${r};${pulseTo}`} dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.4s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r={r} fill="none" stroke={markerColor} strokeOpacity={0.9} strokeWidth={0.3}>
                  <animate attributeName="r" values={`${r};${pulseTo}`} dur="1.4s" begin="0.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.4s" begin="0.7s" repeatCount="indefinite" />
                </circle>
              </g>
            ) : null}
            {renderMarkerOverlay?.({ marker: { ...marker, x, y }, index, x, y, r })}
          </g>
        );
      })}
    </svg>
  );
}
