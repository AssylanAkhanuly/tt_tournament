/* Страницы без входа ✳ (10.09.2026): титульная карточка входа и шапка
   публичного сайта.

   Раньше обе жили только в макетах (`design/src/mockups/role00.tsx`) и сразу
   внутри рамки ноутбука, поэтому экран приложения рисовался заново и уже
   начинал отличаться от макета. Теперь здесь, без рамки: макет оборачивает их
   в `Laptop` / `Phone`, приложение показывает во весь экран (`FullScreen`).
   Вид один — отличается только корпус устройства. */

import type { ReactNode } from 'react';

import { Brand } from '../brand';

/* Фон титульных страниц ✳ (19.11.2026, решение владельца продукта): только
   фирменный синий, без орнамента и узоров. Перепробованные варианты (орнамент
   по краям и на шве, линии, круговой узор, картинки fal.ai) сняты. */

/** Подпись в подвале титульных страниц — одна на оба формата; две строки
    друг под другом, а не одна через точку ✳ (22.11.2026, решение владельца
    продукта). */
export const AUTH_FOOT = (
  <>
    <span className="block">Федерация настольного тенниса Республики Казахстан</span>
    <span className="block">цифровая платформа турниров</span>
  </>
);

/** Титульная страница: до входа ни сайдбара, ни профиля. Экран поделён
    надвое ✳ (19.11.2026, решение владельца продукта): слева — фирменный синий
    со знаком QTT и подписью федерации под ним; справа — белая половина с формой, без карточки вокруг. На
    телефоне половины встают друг под другом, синяя — низкой полосой только со
    знаком, подпись федерации — мелко в самом низу экрана ✳ (19.11.2026).
    `judge` — своя окраска формы судьи: формы похожи как две капли, и
    заголовок читают уже после того, как начали заполнять; сам вход не
    окрашивается — он один на всех. */
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:flex-row">
      {/* Половины поровну ✳ (19.11.2026, решение владельца продукта). */}
      <div
        className="relative flex shrink-0 flex-col overflow-hidden bg-linear-to-br from-brand-800 via-brand-900 to-brand-950 md:w-1/2"
        data-testid="auth-brand"
      >
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-10 pl-10 pr-10 max-md:gap-1.5 max-md:px-6 max-md:py-4">
          <Brand size="xl" inverse />
          {/* Подпись федерации — под знаком, мелко ✳ (19.11.2026, решение владельца
              продукта); на телефоне — внизу экрана, под формой. */}
          <p className="m-0 max-w-[30rem] text-center text-[13px] leading-snug text-brand-200 max-md:hidden" data-testid="auth-caption">
            {AUTH_FOOT}
          </p>
        </div>
      </div>
      {/* Форма на десктопе — по центру половины ✳ (19.11.2026, решение владельца
          продукта); на телефоне — сразу под полосой: так она не прыгает, когда
          выезжает клавиатура. */}
      <div
        className="relative flex min-h-0 flex-1 flex-col items-center overflow-auto justify-center px-8 py-8 max-md:justify-start max-md:px-6 max-md:pb-[max(16px,env(safe-area-inset-bottom))] max-md:pt-8"
        data-testid="auth-form"
      >
        <div
          className={
            'w-full ' +
            (wide ? 'max-w-[560px]' : 'max-w-[400px]') +
            (judge ? ' border-t-4 border-t-amber-500 pt-6' : '')
          }
        >
          {children}
        </div>
        {/* Отступ снизу — с запасом на полоску «домой» у iPhone (safe-area). */}
        <p className="m-0 mt-6 shrink-0 text-center text-[11px] max-md:mt-auto max-md:pt-6 leading-snug text-neutral-500 md:hidden" data-testid="auth-caption-bottom">
          {AUTH_FOOT}
        </p>
      </div>
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
      (on ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-50')
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
