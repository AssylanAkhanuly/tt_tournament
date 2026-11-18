/* Страницы без входа ✳ (10.09.2026): титульная карточка входа и шапка
   публичного сайта.

   Раньше обе жили только в макетах (`design/src/mockups/role00.tsx`) и сразу
   внутри рамки ноутбука, поэтому экран приложения рисовался заново и уже
   начинал отличаться от макета. Теперь здесь, без рамки: макет оборачивает их
   в `Laptop` / `Phone`, приложение показывает во весь экран (`FullScreen`).
   Вид один — отличается только корпус устройства. */

import type { ReactNode } from 'react';

import { assetUrl } from '../asset';
import { Brand } from '../brand';
import ornamentRowUrl from '../brand/ornament-row.svg';
import ornamentUrl from '../brand/ornament-strip.svg';

/* Фон титульных страниц ✳ (19.11.2026, решения владельца продукта): только
   фирменный синий и лента орнамента — контур `ittf-ornament-strip.svg`
   лендинга Astana 2027 (`brand/ornament-strip.svg`), маской: цвет даёт шкала
   `brand`, сырых цветов в ките нет. Шаг повтора короче родного (×1,36 ширины
   вместо ×1,59) — завитки сходятся в одну ленту.
   - На десктопе лента стоит ровно на шве: её середина — граница синей и белой
     половин, половина ленты на синем, половина на белом (`SeamOrnament`).
   - На телефоне синяя половина — низкая полоса, и вертикальная лента в ней
     обрезалась бы в огрызок: там лента идёт по нижнему краю полосы, тем же
     контуром, повёрнутым (`brand/ornament-row.svg`).
   Всё за знаком и не ловит клики. */
const ORNAMENT = assetUrl(ornamentUrl);
const ORNAMENT_ROW = assetUrl(ornamentRowUrl);
const STRIP_W = 'clamp(44px,4.8vw,92px)';
const ROW_H = '22px';

const STRIP = {
  maskImage: `url(${ORNAMENT})`,
  WebkitMaskImage: `url(${ORNAMENT})`,
  maskSize: `100% calc(${STRIP_W} * 1.36)`,
  WebkitMaskSize: `100% calc(${STRIP_W} * 1.36)`,
  maskRepeat: 'repeat-y',
  WebkitMaskRepeat: 'repeat-y',
} as const;

/** Лента орнамента ровно по шву ✳ (19.11.2026, решение владельца продукта):
 *  центр ленты на границе синей и белой половин. Цвет — от фона под ним, чтобы
 *  держать контраст: на синей половине завитки белые, на белой — синие. Это
 *  два слоя одной маски, каждый срезан по своей половине ленты. Стоит над
 *  обеими половинами, поэтому живёт в корне экрана. */
function SeamOrnament() {
  const half = 'absolute inset-0';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[clamp(44px,4.8vw,92px)] -translate-x-1/2 max-md:hidden"
      data-testid="auth-ornament"
    >
      <div className={half + ' bg-white opacity-45 [clip-path:inset(0_50%_0_0)]'} style={STRIP} />
      <div className={half + ' bg-brand-800 opacity-45 [clip-path:inset(0_0_0_50%)]'} style={STRIP} />
    </div>
  );
}

function AuthBackdrop() {
  const row = {
    maskImage: `url(${ORNAMENT_ROW})`,
    WebkitMaskImage: `url(${ORNAMENT_ROW})`,
    maskSize: `calc(${ROW_H} * 1.36) 100%`,
    WebkitMaskSize: `calc(${ROW_H} * 1.36) 100%`,
    maskRepeat: 'repeat-x',
    WebkitMaskRepeat: 'repeat-x',
  } as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-testid="auth-backdrop">
      <div
        className="absolute inset-x-0 bottom-2 h-[22px] bg-brand-400 opacity-35 md:hidden"
        style={row}
        data-testid="auth-ornament-row"
      />
    </div>
  );
}

/** Подпись в подвале титульных страниц — одна на оба формата. */
export const AUTH_FOOT = 'Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров';

/** Титульная страница: до входа ни сайдбара, ни профиля. Экран поделён
    надвое ✳ (19.11.2026, решение владельца продукта): слева — фирменный синий
    со знаком QTT и подписью федерации под ним, лента орнамента на шве
    (`AuthBackdrop`); справа — белая половина с формой, без карточки вокруг. На
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
      <SeamOrnament />
      {/* Половины поровну ✳ (19.11.2026, решение владельца продукта). */}
      <div
        className="relative flex shrink-0 flex-col overflow-hidden bg-linear-to-br from-brand-800 via-brand-900 to-brand-950 md:w-1/2"
        data-testid="auth-brand"
      >
        <AuthBackdrop />
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-10 pl-10 pr-[calc(2.5rem+clamp(44px,4.8vw,92px)/2)] max-md:gap-1.5 max-md:px-6 max-md:pb-9 max-md:pt-4">
          <Brand size="xl" inverse />
          {/* Подпись федерации — под знаком, мелко ✳ (19.11.2026, решение владельца
              продукта); на телефоне — внизу экрана, под формой. */}
          <p className="m-0 max-w-[30rem] text-center text-[13px] leading-snug text-brand-200 max-md:hidden" data-testid="auth-caption">
            {AUTH_FOOT}
          </p>
        </div>
      </div>
      {/* Форма — колонкой от верхней трети, а не по центру ✳ (19.11.2026): на
          широком экране она не плавает в белом, на телефоне начинается сразу под
          полосой и не прыгает, когда выезжает клавиатура. */}
      <div
        className="relative flex min-h-0 flex-1 flex-col items-center overflow-auto px-8 pb-8 pt-[18vh] max-md:px-6 max-md:pb-[max(16px,env(safe-area-inset-bottom))] max-md:pt-8"
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
        <p className="m-0 mt-auto shrink-0 pt-6 text-center text-[11px] leading-snug text-neutral-500 md:hidden" data-testid="auth-caption-bottom">
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
