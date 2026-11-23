'use client';

/* Карта места турнира — обёртка: Leaflet трогает `window`, поэтому сама карта
   (`KzMapLeaflet`) грузится только в браузере. */

import dynamic from 'next/dynamic';

export const KzMap = dynamic(() => import('./KzMapLeaflet'), { ssr: false, loading: () => <div className="h-full w-full bg-neutral-800" /> });

export { KZ_CITIES } from './kzMapData';
