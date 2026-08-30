/* Общая обвязка справочника HeroUI 3 ✳ (30.08.2026).

   Справочник переписан с нуля: прежний файл (HeroDocs) показывал компоненты
   монолитным API из версии 2 — а тройка композиционная. `<ProgressBar/>` без
   `Track`/`Fill` рендерит пустоту, `<Badge>` без якоря улетает в угол страницы.
   Поэтому здесь два железных правила:

   1. Структура компонента — только из типов пакета (`dist/components/*.d.ts`):
      каждая часть (`Component.Part`) стоит там, где её ждёт библиотека.
   2. Наборы значений свойств — из объектов `*Variants` самого пакета через
      `values()`: обновится пакет — обновится и справочник.

   Здесь живёт то, что нужно каждому файлу раздела: обёртка страницы,
   секция, строка-матрица «свойство × значение» и доменные данные ФНТ РК. */

import { useState, type ReactNode } from 'react';
import { UNSAFE_PortalProvider } from 'react-aria';
import { I18nProvider } from '@heroui/react';
import { A, AW } from '../../fedCommon';
import '../tailwind.css'; // собран из tailwind.src.css: npm run kit:css

export { A, AW };

/* ── Доменные данные: один словарь на все группы ────────────────── */
export const PLAYERS = [
  { nm: 'Ким Георгий', short: 'Ким Г.', city: 'Алматы', rank: 'МС', rating: 2140, av: A(44) },
  { nm: 'Оспанов Руслан', short: 'Оспанов Р.', city: 'Астана', rank: 'КМС', rating: 1985, av: A(12) },
  { nm: 'Ли Сергей', short: 'Ли С.', city: 'Шымкент', rank: 'КМС', rating: 1904, av: A(23) },
  { nm: 'Ахметов Дастан', short: 'Ахметов Д.', city: 'Караганда', rank: 'I разряд', rating: 1861, av: A(31) },
  { nm: 'Тлеу Алишер', short: 'Тлеу А.', city: 'Алматы', rank: 'I разряд', rating: 1790, av: A(52) },
  { nm: 'Ким Асель', short: 'Ким А.', city: 'Астана', rank: 'КМС', rating: 1938, av: AW(28) },
];
export const TOURNAMENTS = ['Кубок Алматы 2026', 'Чемпионат РК 2026', 'Первенство Астаны'];
export const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз'];

/* ── Обёртка страницы ───────────────────────────────────────────────
   PortalProvider — обязательная часть, а не украшение. Глобальный сброс
   `gen/frame.css` (`*:not(:where(.hero-scope, .hero-scope *)) { margin: 0;
   padding: 0 }`) вне слоёв и потому сильнее слоёв HeroUI; порталы React Aria
   по умолчанию монтируются в `body` — то есть ВНЕ `.hero-scope` — и модалки,
   шторки, меню и тосты приезжали без отступов, а svg в них становились
   блочными. Провайдер направляет все порталы внутрь обёртки: исключение
   сброса снова действует. `react-aria` здесь тот же экземпляр, что внутри
   `react-aria-components` (прямая зависимость) — контекст общий. */
export const Shell = ({ children }: { children: ReactNode }) => {
  /* Стейт вместо ref: оверлеи с defaultOpen монтируются одновременно с
     детьми, и ref в этот момент ещё null — портал ушёл бы в никуда. Дети
     рендерятся только когда контейнер уже существует. */
  const [scope, setScope] = useState<HTMLDivElement | null>(null);
  return (
    <I18nProvider locale="ru-RU">
      <div
        ref={setScope}
        data-theme="light"
        className="hero-scope min-h-screen bg-white p-7 text-neutral-900"
      >
        {scope && (
          <UNSAFE_PortalProvider getContainer={() => scope}>
            <div className="mx-auto flex max-w-4xl flex-col gap-10">{children}</div>
          </UNSAFE_PortalProvider>
        )}
      </div>
    </I18nProvider>
  );
};

/* ── Значения свойства из объекта вариантов пакета ──────────────────
   `tv()` хранит их в `.variants`; ключи `true`/`false` пропускаем — это
   булевы флаги, а не набор значений. */
export function values(variants: unknown, prop: string): string[] {
  const v = (variants as { variants?: Record<string, Record<string, unknown>> })?.variants?.[prop];
  return v ? Object.keys(v).filter((k) => k !== 'true' && k !== 'false') : [];
}

/* ── Строка матрицы: подпись свойства и все значения рядом ──────── */
export const Row = ({
  prop,
  vals,
  render,
}: {
  prop: string;
  vals: string[];
  render: (value: string) => ReactNode;
}) => {
  if (!vals.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {prop}
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
        {vals.map((v) => (
          <div className="flex flex-col items-center gap-1" key={v}>
            {render(v)}
            <span className="text-[11px] text-neutral-400">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Секция одного компонента ───────────────────────────────────── */
export const Section = ({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4 border-t border-neutral-200 pt-6">
    <div>
      <h3 className="text-lg font-semibold">{name}</h3>
      {note && <p className="mt-1 text-sm text-neutral-500">{note}</p>}
    </div>
    {children}
  </section>
);
