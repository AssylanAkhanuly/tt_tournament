'use client';

/* Панель снизу — одна на всё приложение ✳ (03.11.2026, решение владельца
   продукта: на телефоне вместо выпадающих списков, поповеров и окон — панели).
   `Drawer` HeroUI (выезжает снизу, ручка `Drawer.Handle`, закрывается жестом,
   кликом мимо и Esc).

   Отступы заданы здесь один раз, а не каждой панелью: у `Drawer.Dialog`
   HeroUI свой отступ 24 px со всех сторон, и панели, что клали внутрь ещё и
   свой, выходили с двойными полями. Поэтому у диалога отступа нет, а поля в
   24 px (`px-6`) — у шапки, тела и подвала; строки списка в теле идут от края
   до края и сами держат `px-6`, тогда разделители тянутся во всю ширину.
   Шапка и подвал стоят на месте, прокручивается только тело; кнопки подвала —
   во всю ширину. Длинная панель занимает не больше 90 % экрана, `tall` —
   ровно 90 %: для списков с поиском, чтобы панель не прыгала по высоте,
   пока выдача сужается.

   `isOpen` не задан — состояние берётся у обёртки (`Modal` с триггером):
   так окно приложения на телефоне становится этой же панелью (`ModalSheet`). */

import { Drawer } from '@heroui/react';
import type { ReactNode } from 'react';

export const SHEET_GUTTER = 'px-6';

/** Кнопки подвала — поровну во всю ширину. */
export const SHEET_FOOTER = 'mt-0 flex shrink-0 gap-2 border-t border-neutral-200 py-3 [&>*]:flex-1 ' + SHEET_GUTTER;

export function BottomSheet({
  isOpen,
  onOpenChange,
  title,
  header,
  footer,
  testId,
  dataView,
  bodyClassName = 'px-6 pb-6',
  tall = false,
  raw = false,
  children,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Заголовок панели. */
  title?: ReactNode;
  /** Своя шапка вместо заголовка (стрелка «назад», поиск). */
  header?: ReactNode;
  footer?: ReactNode;
  testId?: string;
  dataView?: string;
  /** Поля тела; список от края до края — `px-0`, строки держат `px-6` сами. */
  bodyClassName?: string;
  /** Ровно 90 % высоты экрана, а не «по содержимому, до 90 %». */
  tall?: boolean;
  /** Содержимое со своей разметкой шапки, тела и подвала (окно `ModalSheet`). */
  raw?: boolean;
  children: ReactNode;
}) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog
          className={(tall ? 'h-[90vh] ' : '') + 'max-h-[90vh] rounded-t-xl p-0'}
          data-testid={testId}
          data-view={dataView}
          data-sheet="yes"
        >
          <Drawer.Handle className="shrink-0 pt-3" />
          {raw ? (
            children
          ) : (
            <>
              {(title || header) && (
                <Drawer.Header className={'shrink-0 pb-3 pt-1 ' + SHEET_GUTTER}>
                  {header ?? <Drawer.Heading className="text-lg font-semibold">{title}</Drawer.Heading>}
                </Drawer.Header>
              )}
              <Drawer.Body className={'min-h-0 ' + bodyClassName}>{children}</Drawer.Body>
              {footer && <Drawer.Footer className={SHEET_FOOTER}>{footer}</Drawer.Footer>}
            </>
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
