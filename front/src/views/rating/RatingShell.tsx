'use client';

/* Общая обёртка рейтинговых экранов: шапка, скоуп кита и ширина.

   Заведена, чтобы у листа, карточки и калибровки она была одна: иначе три
   экрана одного раздела разъедутся по отступам и кеглю заголовка. */

import Link from 'next/link';
import type { ReactNode } from 'react';

import '@/shared/kit/tailwind.css';
import { SessionBar } from '@/widgets/session';

export function RatingShell({
  title,
  lead,
  back,
  note,
  children,
}: {
  title: string;
  lead?: ReactNode;
  /** Возврат наверх раздела: подпись и адрес. */
  back?: { href: string; label: string };
  /** Предупреждение под шапкой — например, что числа условны до калибровки. */
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="hero-scope min-h-screen bg-neutral-50 text-neutral-900" data-theme="light">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          {/* Справа — кто вошёл: председателю ГСК на этих же экранах
              открываются правки рейтинга, и видеть, от чьего имени он работает,
              надо на каждом из них. */}
          <div className="flex items-start justify-between gap-4">
            {back ? (
              <Link
                href={back.href}
                className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 hover:underline"
              >
                ← {back.label}
              </Link>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Федерация настольного тенниса Республики Казахстан
              </p>
            )}
            <SessionBar />
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          {lead && <div className="mt-1.5 max-w-3xl text-[13.5px] leading-snug text-neutral-600">{lead}</div>}
          {note && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-900">
              {note}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>

      <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-[12px] leading-snug text-neutral-500">
        Рейтинг считается по проекту Положения о формировании и ведении Национального рейтинга спортсменов РК:
        Rнов = Rстар + P × K × C × (S − E). Коэффициент уровня C — таблица п. 13, коэффициент места P — п. 10.3,
        переходный период — п. 11, нижняя граница 0,00 — п. 15.15.
      </footer>
    </div>
  );
}
