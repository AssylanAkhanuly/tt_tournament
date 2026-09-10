/* Страницы без входа ✳ (10.09.2026): титульная карточка входа и шапка
   публичного сайта.

   Раньше обе жили только в макетах (`design/src/mockups/role00.tsx`) и сразу
   внутри рамки ноутбука, поэтому экран приложения рисовался заново и уже
   начинал отличаться от макета. Теперь здесь, без рамки: макет оборачивает их
   в `Laptop` / `Phone`, приложение показывает во весь экран (`FullScreen`).
   Вид один — отличается только корпус устройства. */

import type { ReactNode } from 'react';

import { Brand } from '../brand';

/** Подпись в подвале титульных страниц — одна на оба формата. */
export const AUTH_FOOT = 'Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров';

/** Титульная страница: до входа ни сайдбара, ни профиля — карточка по центру
    на фирменном синем. Синий — цвет знака ФНТ; кольца на фоне — намёк на мяч,
    нарисованы рамками, без картинок. `judge` — своя окраска формы судьи:
    формы похожи как две капли, и заголовок читают уже после того, как начали
    заполнять; сам вход не окрашивается — он один на всех. */
export function AuthScreen({
  wide,
  judge,
  children,
}: {
  wide?: boolean;
  judge?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-blue-800 via-blue-900 to-blue-950">
      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full border-[30px] border-blue-700/40" />
      <div className="pointer-events-none absolute -bottom-36 -right-20 h-[440px] w-[440px] rounded-full border-[38px] border-blue-700/30" />
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
        <div
          className={
            'my-auto max-w-full rounded-2xl bg-white p-7 shadow-2xl ' +
            (wide ? 'w-[560px]' : 'w-[400px]') +
            (judge ? ' border-t-4 border-t-amber-500' : '')
          }
        >
          {children}
        </div>
      </div>
      <div className="relative shrink-0 pb-5 text-center text-xs text-blue-200/80">{AUTH_FOOT}</div>
    </div>
  );
}

/** Раздел публичного сайта. `onPick` — переход в приложении; в макетах его
    нет, переходы там ловит карта флоу. */
export type SiteItem = { t: string; onPick?: () => void };

const SiteLink = ({ item, on }: { item: SiteItem; on: boolean }) => (
  <button
    type="button"
    aria-current={on || undefined}
    onClick={item.onPick}
    className={
      'shrink-0 rounded-lg px-2.5 py-1.5 ' +
      (on ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-50')
    }
  >
    {item.t}
  </button>
);

/** Шапка сайта: одна на все публичные страницы — разделы, язык и «Войти».
    Общая нарочно: публичная часть — один сайт, и шапка не должна разъезжаться
    между страницами.

    `right` — правый край: язык и «Войти». Наполнение у макета и приложения
    своё (в макете кнопка ведёт по карте флоу, в приложении — на вход), а
    место и вид одни.

    `one` — телефон ✳ (30.08.2026): знак, язык и «Войти» первой строкой,
    разделы — второй, с прокруткой вбок. Нижней панели вкладок у публичной
    части нет и не будет: это сайт, а не приложение, и человек в него не
    входил. */
export function SiteHeader({
  items,
  active,
  one,
  right,
}: {
  items: SiteItem[];
  active: string;
  one?: boolean;
  right?: ReactNode;
}) {
  return one ? (
    <div className="shrink-0 border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-2">
        <Brand size="sm" />
        <div className="flex-1" />
        {right}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-1.5 text-[13px] font-medium">
        {items.map((it) => (
          <SiteLink key={it.t} item={it} on={it.t === active} />
        ))}
      </nav>
    </div>
  ) : (
    <div className="flex h-14 shrink-0 items-center gap-6 border-b border-neutral-200 bg-white px-6">
      <Brand />
      <nav className="flex items-center gap-1 text-[13px] font-medium">
        {items.map((it) => (
          <SiteLink key={it.t} item={it} on={it.t === active} />
        ))}
      </nav>
      <div className="flex-1" />
      {right}
    </div>
  );
}
