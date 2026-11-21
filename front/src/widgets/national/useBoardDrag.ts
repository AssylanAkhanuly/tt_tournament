'use client';

/* Перетаскивание на доске планов ✳ (22.11.2026, решение владельца продукта:
   «как в календаре — растягивать пункты и создавать протягиванием»).

   Один обработчик указателя на дорожку строки, два жеста:

   - **создание** — нажали на пустой день и протянули по строке: выделение
     идёт за указателем, отпустили — окно создания на выбранные дни (щелчок без
     протягивания — один день, как раньше);
   - **растягивание** — тянут за край пункта (`data-edge="start" | "end"`):
     край идёт по дням, начало не уходит за конец; отпустили — новые даты
     уходят на сервер.

   День под указателем считается по доле ширины дорожки — столбцы равные.
   Указатель захватывается дорожкой (`setPointerCapture`): жест не теряется,
   если увести мышь за строку. Права решает сервер — сюда приходят только
   флаги строки (`canCreate`) и пункта (`canMove`). */

import { useRef, useState, type PointerEvent } from 'react';

import type { BoardItem, BoardRow } from '@/entities/national';

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export type BoardDrag =
  | { kind: 'create'; rowId: string; a: string; b: string }
  | { kind: 'resize'; rowId: string; item: BoardItem; edge: 'start' | 'end'; start: string; end: string };

export function useBoardDrag({
  from,
  days,
  onCreate,
  onResize,
}: {
  from: Date;
  days: number;
  onCreate: (row: BoardRow, start: string, end: string) => void;
  onResize: (item: BoardItem, start: string, end: string) => void;
}) {
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const live = useRef<BoardDrag | null>(null);
  const put = (d: BoardDrag | null) => {
    live.current = d;
    setDrag(d);
  };

  /** День под указателем: доля ширины дорожки, в пределах окна. */
  const dayAt = (track: HTMLElement, x: number) => {
    const r = track.getBoundingClientRect();
    const n = Math.min(days - 1, Math.max(0, Math.floor(((x - r.left) / r.width) * days)));
    return iso(new Date(from.getTime() + n * DAY));
  };

  function trackProps(row: BoardRow, canCreate: boolean) {
    return {
      'data-track': '',
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (e.button !== 0) return;
        const t = e.target as HTMLElement;
        const handle = t.closest<HTMLElement>('[data-edge]');
        if (handle) {
          const item = row.items.find((i) => i.id === handle.dataset.item);
          if (!item?.canMove) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          put({ kind: 'resize', rowId: row.member.id, item, edge: handle.dataset.edge as 'start' | 'end', start: item.startsOn, end: item.endsOn });
          return;
        }
        if (!canCreate || !t.closest('[data-testid="plan-board-cell"]')) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const d = dayAt(e.currentTarget, e.clientX);
        put({ kind: 'create', rowId: row.member.id, a: d, b: d });
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const d = live.current;
        if (!d || d.rowId !== row.member.id) return;
        const day = dayAt(e.currentTarget, e.clientX);
        if (d.kind === 'create') {
          if (day !== d.b) put({ ...d, b: day });
          return;
        }
        // Край не переходит через другой: пункт не короче одного дня.
        const next = d.edge === 'start' ? { start: day < d.end ? day : d.end, end: d.end } : { start: d.start, end: day > d.start ? day : d.start };
        if (next.start !== d.start || next.end !== d.end) put({ ...d, ...next });
      },
      onPointerUp() {
        const d = live.current;
        if (!d || d.rowId !== row.member.id) return;
        put(null);
        if (d.kind === 'create') {
          const [lo, hi] = d.a <= d.b ? [d.a, d.b] : [d.b, d.a];
          onCreate(row, lo, hi);
        } else if (d.start !== d.item.startsOn || d.end !== d.item.endsOn) {
          onResize(d.item, d.start, d.end);
        }
      },
      onPointerCancel() {
        put(null);
      },
    };
  }

  return { drag, trackProps };
}
