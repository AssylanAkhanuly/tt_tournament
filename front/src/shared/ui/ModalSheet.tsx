'use client';

/* Окно приложения ✳ (03.11.2026, решение владельца продукта: «на телефоне окна
   — панелями снизу»). На десктопе — окно HeroUI посередине экрана, как было.
   На телефоне (`useNarrow`) то же содержимое открывается настоящей панелью
   снизу (`BottomSheet` на `Drawer` HeroUI): выезжает, тянется за ручку,
   закрывается жестом, кликом мимо и Esc — поэтому крестика окна в ней нет.

   Заменяет обёртку целиком — `Modal.Backdrop` + `Modal.Container` +
   `Modal.Dialog` (у подтверждений — то же у `AlertDialog`); шапка, тело и
   подвал окна внутри не меняются. Открытием управляет либо корень `Modal` /
   `AlertDialog` с кнопкой-триггером, либо `isOpen` / `onOpenChange`.
   HeroUI + Tailwind. */

import { AlertDialog, Modal } from '@heroui/react';
import type { ReactNode } from 'react';

import { useNarrow } from '@/shared/kit/app';
import { BottomSheet } from './BottomSheet';

/** Окно внутри панели: шапка и подвал на месте, прокручивается только тело,
    поля — те же `px-6`, что у `BottomSheet`, кнопки подвала — во всю ширину.
    Крестика нет: панель закрывается жестом и кликом мимо. Форма (`<form>`
    вокруг тела и подвала) растягивается так же. Слоты — `data-slot` HeroUI. */
// Классы — целыми строками: Tailwind находит их только в исходнике как есть.
const IN_MODAL =
  'flex min-h-0 flex-1 flex-col [&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col [&_[data-slot=modal-close-trigger]]:hidden [&_[data-slot=modal-header]]:shrink-0 [&_[data-slot=modal-header]]:px-6 [&_[data-slot=modal-header]]:pb-3 [&_[data-slot=modal-header]]:pt-1 [&_[data-slot=modal-body]]:m-0 [&_[data-slot=modal-body]]:min-h-0 [&_[data-slot=modal-body]]:flex-1 [&_[data-slot=modal-body]]:overflow-y-auto [&_[data-slot=modal-body]]:px-6 [&_[data-slot=modal-body]]:py-2 [&_[data-slot=modal-footer]]:mt-0 [&_[data-slot=modal-footer]]:shrink-0 [&_[data-slot=modal-footer]]:border-t [&_[data-slot=modal-footer]]:border-neutral-200 [&_[data-slot=modal-footer]]:px-6 [&_[data-slot=modal-footer]]:py-3 [&_[data-slot=modal-footer]>*]:flex-1';
const IN_ALERT =
  'flex min-h-0 flex-1 flex-col [&_[data-slot=alert-dialog-close-trigger]]:hidden [&_[data-slot=alert-dialog-header]]:shrink-0 [&_[data-slot=alert-dialog-header]]:px-6 [&_[data-slot=alert-dialog-header]]:pb-3 [&_[data-slot=alert-dialog-header]]:pt-1 [&_[data-slot=alert-dialog-body]]:m-0 [&_[data-slot=alert-dialog-body]]:min-h-0 [&_[data-slot=alert-dialog-body]]:flex-1 [&_[data-slot=alert-dialog-body]]:overflow-y-auto [&_[data-slot=alert-dialog-body]]:px-6 [&_[data-slot=alert-dialog-body]]:py-2 [&_[data-slot=alert-dialog-footer]]:mt-0 [&_[data-slot=alert-dialog-footer]]:shrink-0 [&_[data-slot=alert-dialog-footer]]:border-t [&_[data-slot=alert-dialog-footer]]:border-neutral-200 [&_[data-slot=alert-dialog-footer]]:px-6 [&_[data-slot=alert-dialog-footer]]:py-3 [&_[data-slot=alert-dialog-footer]>*]:flex-1';

type Open = { isOpen?: boolean; onOpenChange?: (open: boolean) => void };

export function ModalSheet({
  size = 'md',
  className = 'rounded-xl',
  testId,
  isOpen,
  onOpenChange,
  tall,
  children,
}: Open & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full';
  /** На телефоне — ровно 90 % экрана (списки с поиском). */
  tall?: boolean;
  className?: string;
  testId?: string;
  children: ReactNode;
}) {
  const narrow = useNarrow();
  if (narrow) {
    return (
      <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} testId={testId} tall={tall} raw>
        <div className={IN_MODAL}>{children}</div>
      </BottomSheet>
    );
  }
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size={size}>
        <Modal.Dialog className={className} data-testid={testId} data-sheet="no">
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function AlertSheet({
  className = 'rounded-xl',
  testId,
  isOpen,
  onOpenChange,
  children,
}: Open & {
  className?: string;
  testId?: string;
  children: ReactNode;
}) {
  const narrow = useNarrow();
  if (narrow) {
    return (
      <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} testId={testId} raw>
        <div className={IN_ALERT}>{children}</div>
      </BottomSheet>
    );
  }
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Container>
        <AlertDialog.Dialog className={className} data-testid={testId} data-sheet="no">
          {children}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
