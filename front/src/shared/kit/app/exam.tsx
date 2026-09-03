/* Экзамен: отдельный режим экрана ✳ (31.08.2026).

   Аттестация — не раздел кабинета, а испытание с началом и концом. Пока тест
   идёт, оболочка роли только мешает: сайдбар зовёт уйти в «Турниры», шапка
   показывает уведомления, а решение экрана — ответить и перейти к следующему
   вопросу. Поэтому у теста своя раскладка, как в любой системе тестирования:

   - слева — навигатор по вопросам: сетка номеров, отвеченные закрашены,
     текущий обведён. По ней видно, сколько осталось, и можно прыгнуть к
     пропущенному, а не листать «Дальше» двадцать раз;
   - в центре — сам вопрос и варианты, во всю ширину и крупно: это
     единственное, чем человек занят;
   - справа — время, порядок и решения: «Завершить тест» и выход.

   Выйти можно только явно — кнопкой, а не случайным кликом по разделу.

   На телефоне колонок нет: номера уходят полосой над вопросом, время — в
   шапку, решения — в нижнюю полосу. Смысл тот же: экран занят вопросом. */

import type { ReactNode } from 'react';
import { Laptop, Phone } from './frame';
import { Brand } from '../brand';

/** Номер вопроса в навигаторе: отвечен, текущий, ещё не открыт. */
export type ExamMark = { n: number; answered?: boolean; current?: boolean };

const cell = (m: ExamMark) =>
  'flex h-8 w-8 items-center justify-center rounded-lg text-[12.5px] font-semibold tabular-nums ' +
  (m.current
    ? 'bg-blue-600 text-white'
    : m.answered
    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    : 'bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200');

/** Сетка номеров вопросов. Один компонент на оба формата: на телефоне она
    просто едет вбок, а не превращается во что-то другое. */
export function ExamNav({
  marks,
  onGo,
  row,
}: {
  marks: ExamMark[];
  onGo?: (i: number) => void;
  /** Полосой в одну строку — телефонный вариант. */
  row?: boolean;
}) {
  return (
    <div className={row ? 'flex gap-1.5 overflow-x-auto pb-1' : 'grid grid-cols-5 gap-1.5'}>
      {marks.map((m, i) => (
        <button
          key={m.n}
          type="button"
          aria-current={m.current || undefined}
          onClick={onGo ? () => onGo(i) : undefined}
          className={cell(m) + (row ? ' shrink-0' : '')}
        >
          {m.n}
        </button>
      ))}
    </div>
  );
}

/** Время до конца теста — крупно: это второе, на что смотрит человек после
    самого вопроса. `hot` — времени мало, счётчик краснеет. */
export const ExamClock = ({ left, hot }: { left: string; hot?: boolean }) => (
  <div className={'rounded-xl border p-3 text-center ' + (hot ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white')}>
    <div className={'text-2xl font-bold tabular-nums ' + (hot ? 'text-red-700' : 'text-neutral-900')}>{left}</div>
    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-400">осталось</div>
  </div>
);

/** Экзамен на десктопе: три колонки без оболочки роли. */
export function ExamShell({
  title,
  sub,
  left,
  right,
  children,
}: {
  title: string;
  sub?: string;
  /** Левая колонка: навигатор по вопросам и легенда. */
  left: ReactNode;
  /** Правая колонка: время, порядок, решения. */
  right: ReactNode;
  /** Центр: вопрос и варианты. */
  children: ReactNode;
}) {
  return (
    <Laptop>
      {/* Шапка теста, а не продукта: ни уведомлений, ни меню профиля — уйти
          отсюда можно только кнопкой справа. Ярлыка «идёт аттестация» здесь
          тоже нет ✳: он повторял сам экран — человек стоит внутри теста, перед
          ним вопросы и часы. */}
      <div className="flex h-14 shrink-0 items-center gap-3.5 border-b border-neutral-200 bg-white px-5">
        <Brand size="sm" />
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold">{title}</div>
          {sub && <div className="text-[11px] text-neutral-500">{sub}</div>}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 bg-neutral-50">
        <aside className="w-[212px] shrink-0 overflow-auto border-r border-neutral-200 bg-white p-4">
          {left}
        </aside>
        <div className="min-w-0 flex-1 overflow-auto p-6">{children}</div>
        <aside className="w-[248px] shrink-0 overflow-auto border-l border-neutral-200 bg-white p-4">
          {right}
        </aside>
      </div>
    </Laptop>
  );
}

/** Экзамен на телефоне: колонок нет, но режим тот же — экран занят вопросом. */
export function ExamPhone({
  title,
  clock,
  nav,
  foot,
  children,
}: {
  title: string;
  /** Время — строкой в шапке: колонки под него нет. */
  clock: string;
  /** Полоса номеров вопросов над вопросом. */
  nav: ReactNode;
  /** Нижняя полоса решений: «Назад», «Дальше», «Завершить». */
  foot: ReactNode;
  children: ReactNode;
}) {
  return (
    <Phone>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2.5">
        {/* Ярлык «идёт аттестация» убран ✳ (03.09.2026): человек внутри теста —
            перед ним вопросы и часы, и сообщать ему, что тест идёт, значит
            занимать место сообщением, которое он и так видит. */}
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13.5px] font-semibold">{title}</div>
        </div>
        <div className="shrink-0 text-[15px] font-bold tabular-nums">{clock}</div>
      </div>
      <div className="shrink-0 border-b border-neutral-200 px-4 py-2">{nav}</div>
      <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 p-4">{children}</div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 bg-white px-4 py-3">
        {foot}
      </div>
    </Phone>
  );
}
