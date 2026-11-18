/* Локап бренда — знак QTT со словесной частью QAZ TABLE TENNIS, единый для
   шапок всех ролей ✳ (17.11.2026, ребрендинг федерации: брендбук «QAZ TABLE
   TENNIS», разбор — docs/refs/qaz-table-tennis-brendbuk-2026-11-05.md).

   Знак — целиком из брендбука, векторами (`brand/qtt-logo.svg` — тёмно-синий
   с голубым мячом для светлого фона, `brand/qtt-logo-inverse.svg` — белый с
   голубым росчерком для тёмного). Словесная часть в знаке уже есть, поэтому
   набранной надписи рядом больше нет — прежде это была квадратная марка ФНТ и
   «ФНТ РК» гротеском.

   Где какая подача — правило прежнее (разбор референсов — `design/README.md`,
   раздел «Локап бренда»):
   • в **шапке продукта** локап тихий — только знак, без `sub`;
   • `sub` — роль или уточнение — встаёт справа за тонкой чертой: на
     телефонных шапках локап и есть всё содержимое шапки. */

import logoUrl from '@/shared/kit/brand/qtt-logo.svg';
import logoInverseUrl from '@/shared/kit/brand/qtt-logo-inverse.svg';

import { assetUrl } from './asset';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

const LOGO = assetUrl(logoUrl);
const LOGO_INVERSE = assetUrl(logoInverseUrl);

export type BrandSize = 'sm' | 'md' | 'lg' | 'xl';

/* Высота знака по подаче: `sm` — телефон и узкие шапки, `md` — десктоп, `lg` —
   титульные экраны. Знак вытянут (≈ 2,7 : 1) и несёт три строки словесной
   части, поэтому он выше прежней квадратной марки: ниже 30 px надпись
   QAZ TABLE TENNIS перестаёт читаться. */
const SIZE: Record<BrandSize, { root: string; logo: string; sub: string }> = {
  sm: { root: 'gap-[10px]', logo: 'h-[30px]', sub: 'text-[9px] tracking-[1px]' },
  md: { root: 'gap-[12px]', logo: 'h-[36px]', sub: 'text-[10px] tracking-[1.1px]' },
  lg: { root: 'gap-[16px]', logo: 'h-[56px]', sub: 'text-[11px] tracking-[1.1px]' },
  // Половина титульного экрана со знаком ✳ (19.11.2026): знак — главное на ней.
  xl: { root: 'gap-[20px]', logo: 'h-[104px] max-md:h-[44px]', sub: 'text-[12px] tracking-[1.4px]' },
};

export function Brand({
  sub,
  size = 'md',
  inverse,
  className,
}: {
  /** Вторая строка: роль («Судья», «Федерация») либо уточнение. Без неё — только знак. */
  sub?: string;
  /** `sm` — телефон и узкие шапки, `md` — десктоп, `lg` — титульные экраны. */
  size?: BrandSize;
  /** Тёмный фон под знаком: белый знак вместо тёмно-синего. */
  inverse?: boolean;
  className?: string;
}) {
  const z = SIZE[size];
  return (
    <div className={cx('flex min-w-0 items-center', z.root, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={cx('block w-auto shrink-0', z.logo)} src={inverse ? LOGO_INVERSE : LOGO} alt="QAZ TABLE TENNIS" />
      {/* Вторая строка — роль либо уточнение. Мелкая, разрядка крупная: она
          работает как подпись к знаку, а не как второй заголовок. */}
      {sub && (
        <i
          className={cx(
            'min-w-0 truncate border-l border-current/20 pl-[10px] font-semibold not-italic uppercase leading-tight text-[color:var(--c-muted)]',
            z.sub,
          )}
        >
          {sub}
        </i>
      )}
    </div>
  );
}
