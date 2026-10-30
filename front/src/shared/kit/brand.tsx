/* Локап ФНТ РК — знак плюс словесная часть, единый для шапок всех ролей.

   Зачем примитив, а не `<img>` по месту: раньше в каждой шапке лежала своя
   пара «картинка + текст», причём текстом была роль («Судья», «Федерация»), и
   бренд из шапки таким образом пропадал. Здесь бренд всегда на месте, а роль
   уходит во вторую строку локапа.

   Знак — `brand/fnt/fnt-mark.svg`: квадратная марка, собранная из официального
   знака (лента орнамента и надпись TTFRK выброшены — на 30 px они всё равно
   нечитаемы). Подробности и происхождение — `brand/fnt/README.md`.

   Где какая подача — правило снято с референсов (MLS, DAZN, adidas, NFL, Uxcel,
   Lovable, Vercel; разбор — `design/README.md`, раздел «Локап бренда»):
   • в **шапке продукта** локап однострочный и тихий — там уже стоит название
     турнира, вторая строка с ним конкурирует. Это `<Brand />` без `sub`;
   • **две строки** — язык карточки сущности, поэтому `sub` уместен на
     телефонных шапках, где локап и есть всё содержимое шапки. */

import markUrl from '@/shared/kit/brand/fnt-mark.svg';

import { assetUrl } from './asset';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

const MARK = assetUrl(markUrl);

export type BrandSize = 'sm' | 'md' | 'lg';

/* Размеры по подаче: `sm` — телефон и узкие шапки, `md` — десктоп, `lg` —
   титульные экраны и витрины. */
const SIZE: Record<BrandSize, { root: string; mark: string; word: string; sub: string }> = {
  sm: {
    root: 'gap-[9px]',
    mark: 'h-[28px] w-[28px] rounded-[var(--r-xs)]',
    word: 'text-[16px] tracking-[.6px]',
    sub: 'mt-[2px] text-[8.5px] tracking-[1px]',
  },
  md: {
    root: 'gap-[11px]',
    mark: 'h-[34px] w-[34px] rounded-[var(--r-xs)]',
    word: 'text-[19px] tracking-[.6px]',
    sub: 'mt-[3px] text-[9.5px] tracking-[1.1px]',
  },
  lg: {
    root: 'gap-[14px]',
    mark: 'h-[44px] w-[44px] rounded-[var(--r-sm)]',
    word: 'text-[25px] tracking-[.8px]',
    sub: 'mt-[4px] text-[11px] tracking-[1.1px]',
  },
};

export function Brand({
  sub,
  size = 'md',
  className,
}: {
  /** Вторая строка: роль («Судья», «Федерация») либо уточнение. Без неё — только знак и «ФНТ РК». */
  sub?: string;
  /** `sm` — телефон и узкие шапки, `md` — десктоп, `lg` — титульные экраны. */
  size?: BrandSize;
  className?: string;
}) {
  const z = SIZE[size];
  return (
    <div className={cx('flex min-w-0 items-center', z.root, className)}>
      {/* Знак — квадратная марка (brand/fnt/fnt-mark.svg). Скругление своё, а не
          от картинки: в SVG угол уже скруглён, но при мелком кегле край чуть
          звенит, поэтому подрезаем ещё и рамкой. Свечение — тем же токеном, что
          у прежнего логотипа, чтобы знак не «отклеивался» от тёмной панели. */}
      <img
        className={cx('block [box-shadow:0_2px_10px_var(--c-accent-line-2)]', z.mark)}
        src={MARK}
        alt="ФНТ РК"
      />
      <span className="flex min-w-0 flex-col leading-none">
        {/* Словесная часть набрана узким тяжёлым гротеском (--font-brand), а не
            рабочим шрифтом макета: это подпись бренда, она не должна ездить за
            переключателем «Шрифт» в тулбаре. Родство с надписью TTFRK на самом
            знаке — в пропорциях. */}
        <b className={cx('font-[family-name:var(--font-brand)] font-extrabold whitespace-nowrap uppercase', z.word)}>
          ФНТ РК
        </b>
        {/* Вторая строка — роль («Судья», «Федерация») либо уточнение. Мелкая,
            разрядка крупная: строка работает как подпись под знаком, а не как
            второй заголовок. */}
        {sub && (
          <i
            className={cx(
              'truncate font-semibold text-[color:var(--c-muted)] not-italic uppercase',
              z.sub,
            )}
          >
            {sub}
          </i>
        )}
      </span>
    </div>
  );
}
