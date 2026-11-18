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
import ornamentUrl from '../brand/ornament-strip.svg';

/* Фон титульных страниц ✳ (19.11.2026, решение владельца продукта): только
   фирменный синий, лента орнамента у левого края и один круговой узор в углу.
   - Орнамент — контур `ittf-ornament-strip.svg` лендинга Astana 2027
     (`brand/ornament-strip.svg`), маской: цвет даёт шкала `brand`, сырых
     цветов в ките нет. Шаг повтора короче родного (×1,36 ширины вместо
     ×1,59) — завитки сходятся в одну ленту.
   - Круговой узор — концентрические окружности из правого нижнего угла,
     `stroke="currentColor"` в цвете той же шкалы; угол срезает их на четверть.
   Всё на синей половине, за знаком, и не ловит клики. */
const ORNAMENT = assetUrl(ornamentUrl);
const STRIP_W = 'clamp(44px,4.8vw,92px)';
const RINGS = Array.from({ length: 14 }, (_, i) => 60 + i * 38);

function AuthBackdrop() {
  const strip = {
    maskImage: `url(${ORNAMENT})`,
    WebkitMaskImage: `url(${ORNAMENT})`,
    maskSize: `100% calc(${STRIP_W} * 1.36)`,
    WebkitMaskSize: `100% calc(${STRIP_W} * 1.36)`,
    maskRepeat: 'repeat-y',
    WebkitMaskRepeat: 'repeat-y',
  } as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-testid="auth-backdrop">
      <div
        className="absolute inset-y-0 left-[1.6vw] w-[clamp(44px,4.8vw,92px)] bg-brand-400 opacity-35"
        style={strip}
        data-testid="auth-ornament"
      />
      <svg
        viewBox="0 0 600 600"
        className="absolute -bottom-px -right-px h-[min(62vh,44vw)] w-[min(62vh,44vw)] text-brand-400 opacity-30 max-md:hidden"
        data-testid="auth-rings"
      >
        {RINGS.map((r) => (
          <circle key={r} cx={600} cy={600} r={r} fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

/** Подпись в подвале титульных страниц — одна на оба формата. */
export const AUTH_FOOT = 'Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров';

/** Титульная страница: до входа ни сайдбара, ни профиля. Экран поделён
    надвое ✳ (19.11.2026, решение владельца продукта): слева — фирменный синий
    со знаком QTT и подписью федерации под ним, лента орнамента слева и
    круговой узор в углу (`AuthBackdrop`); справа — белая половина с формой, без карточки вокруг. На
    телефоне половины встают друг под другом, синяя — низкой полосой: знак
    поменьше и подпись мелко ✳ (19.11.2026).
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
      <div
        className="relative flex shrink-0 flex-col overflow-hidden bg-linear-to-br from-brand-800 via-brand-900 to-brand-950 md:w-1/2"
        data-testid="auth-brand"
      >
        <AuthBackdrop />
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-[calc(3.6vw+clamp(44px,4.8vw,92px))] py-10 max-md:gap-1.5 max-md:py-4">
          <Brand size="xl" inverse />
          {/* Подпись федерации — под знаком, крупно ✳ (19.11.2026, решение владельца продукта). */}
          <p className="m-0 max-w-[30rem] text-center text-lg leading-snug text-brand-100 max-md:text-[11px]" data-testid="auth-caption">
            {AUTH_FOOT}
          </p>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-8" data-testid="auth-form">
        <div
          className={
            'my-auto w-full ' +
            (wide ? 'max-w-[560px]' : 'max-w-[400px]') +
            (judge ? ' border-t-4 border-t-amber-500 pt-6' : '')
          }
        >
          {children}
        </div>
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
