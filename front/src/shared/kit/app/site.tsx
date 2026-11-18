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
import linesUrl from '../brand/line-pattern.svg';
import ornamentUrl from '../brand/ornament-strip.svg';

/* Фон титульных страниц ✳ (19.11.2026, решение владельца продукта: «орнамент
   и линии, как на лендинге Astana 2027»). Две вещи с лендинга
   (`astana-2027-landing`: `EdgeStrips` и узор линий секции сетки):
   - полоса орнамента вдоль левого и правого края — тот же контур, что
     `ittf-ornament-strip.svg` лендинга (`brand/ornament-strip.svg`). Он идёт
     маской, а цвет даёт шкала `brand`: сырых цветов в ките нет;
   - волнистые линии через весь фон — узор `bracket-curves.svg` лендинга
     (`brand/line-pattern.svg`), тоже маской в цвете шкалы `brand`.
   Всё за карточкой и не ловит клики. */
const ORNAMENT = assetUrl(ornamentUrl);
const LINES = assetUrl(linesUrl);

function AuthBackdrop() {
  const strip = {
    maskImage: `url(${ORNAMENT})`,
    WebkitMaskImage: `url(${ORNAMENT})`,
    maskSize: '100% auto',
    WebkitMaskSize: '100% auto',
    maskRepeat: 'repeat-y',
    WebkitMaskRepeat: 'repeat-y',
  } as const;
  const lines = {
    maskImage: `url(${LINES})`,
    WebkitMaskImage: `url(${LINES})`,
    maskSize: 'cover',
    WebkitMaskSize: 'cover',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  } as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-testid="auth-backdrop">
      {/* Линии через весь фон — узор секции сетки лендинга (`bracket-curves.svg`),
          маской: цвет — `bg-brand-400`, как и у орнамента. */}
      <div className="absolute inset-0 bg-brand-400 opacity-25" style={lines} />
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          className={
            'absolute inset-y-0 w-[clamp(40px,4.4vw,84px)] bg-brand-400 opacity-35 ' +
            (side === 'left' ? 'left-[1.4vw]' : 'right-[1.4vw] -scale-x-100')
          }
          style={strip}
        />
      ))}
    </div>
  );
}

/** Подпись в подвале титульных страниц — одна на оба формата. */
export const AUTH_FOOT = 'Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров';

/** Титульная страница: до входа ни сайдбара, ни профиля — карточка по центру
    на фирменном синем. На фоне — орнамент по краям и веер дуг (`AuthBackdrop`,
    ✳ 19.11.2026; до того — два кольца-намёка на мяч). `judge` — своя окраска формы судьи:
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-brand-800 via-brand-900 to-brand-950">
      <AuthBackdrop />
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
      <div className="relative shrink-0 pb-5 text-center text-xs text-brand-200/80">{AUTH_FOOT}</div>
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
