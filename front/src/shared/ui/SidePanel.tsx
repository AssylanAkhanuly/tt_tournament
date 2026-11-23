'use client';

/* Панель карточки ✳ (23.11.2026, решение владельца продукта: «на телефоне
   диалоги — панелью снизу»). На десктопе — `Drawer` HeroUI справа, как было
   (карточки спортсмена, судьи, заявки, матча расписания, настройки). На
   телефоне (`useNarrow`) та же панель выезжает снизу, как `BottomSheet`:
   ручка сверху, не выше 90 % экрана, скруглённый верх, без крестика
   (закрывается жестом и кликом мимо), прокручивается только тело, кнопки
   подвала — во всю ширину.

   Заменяет пару `Drawer.Content placement="right"` + `Drawer.Dialog`:
   `<SideContent><SideDialog className=… data-testid=…>…</SideDialog></SideContent>`.
   Шапка, тело и подвал внутри не меняются. Слоты — `data-slot` HeroUI. */

import { Drawer } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

import { useNarrow } from '@/shared/kit/app';

// Классы — целыми строками: Tailwind находит их только в исходнике как есть.
const AS_SHEET =
  'max-h-[90vh] rounded-t-xl p-0 [&_[data-slot=drawer-close-trigger]]:hidden [&_[data-slot=drawer-header]]:shrink-0 [&_[data-slot=drawer-header]]:px-6 [&_[data-slot=drawer-header]]:pt-1 [&_[data-slot=drawer-body]]:min-h-0 [&_[data-slot=drawer-body]]:overflow-y-auto [&_[data-slot=drawer-body]]:px-6 [&_[data-slot=drawer-footer]]:shrink-0 [&_[data-slot=drawer-footer]]:border-t [&_[data-slot=drawer-footer]]:border-neutral-200 [&_[data-slot=drawer-footer]]:px-6 [&_[data-slot=drawer-footer]]:py-3 [&_[data-slot=drawer-footer]>button]:flex-1';

export function SideContent({ children }: { children: ReactNode }) {
  const narrow = useNarrow();
  return <Drawer.Content placement={narrow ? 'bottom' : 'right'}>{children}</Drawer.Content>;
}

type DialogProps = ComponentProps<typeof Drawer.Dialog>;

/** Детьми — разметка или функция `({ close }) => …`, как у `Drawer.Dialog`. */
export function SideDialog({ className = '', children, ...rest }: DialogProps) {
  const narrow = useNarrow();
  const handle = narrow ? <Drawer.Handle className="shrink-0 pt-3" /> : null;
  return (
    <Drawer.Dialog {...rest} className={narrow ? AS_SHEET : className} data-sheet={narrow ? 'yes' : 'no'}>
      {typeof children === 'function'
        ? (opts) => (
            <>
              {handle}
              {children(opts)}
            </>
          )
        : (
            <>
              {handle}
              {children as ReactNode}
            </>
          )}
    </Drawer.Dialog>
  );
}
