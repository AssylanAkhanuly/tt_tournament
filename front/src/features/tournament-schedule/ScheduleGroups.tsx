'use client';

/* «Группы» расписания ✳ (30.10.2026) — таблица группы, как на бумажном
   протоколе: строки и столбцы — игроки по посеву, на пересечении — счёт
   встречи со стороны игрока строки (партии; победа — жирным, неявка — «+:−» /
   «−:+»), пока не сыграно — время по расписанию, идёт — «идёт». Справа итог:
   победы, поражения, очки (победа 2, поражение 1, неявка 0) и место — их
   считает сервер. Таблицы на всю ширину, без обёрток и полей (решение владельца
   продукта), группа под группой.

   В черновике главный судья переносит игрока в другую группу перетаскиванием
   (dnd kit): за ручку ⠿ у фамилии — на таблицу другой группы, она
   подсвечивается. С
   клавиатуры — пробел, стрелки, пробел, Esc — отмена. Перенос пересчитывает пары
   и время (сервер, `schedule.move`). HeroUI + Tailwind. */

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { moveScheduledPlayer, type Schedule, type ScheduledMatch } from '@/entities/tournament';

import { groupTone, type GroupTone } from './groupTone';
import { MatchResult } from './MatchResult';

type Group = Schedule['groups'][number];
type Player = Group['players'][number];

const pad = (n: number) => String(n).padStart(2, '0');
const pairKey = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a);

/** Ячейка встречи: со стороны игрока строки; не сыграно — время по расписанию. */
function Cell({ match, rowId }: { match?: ScheduledMatch; rowId: string }) {
  if (!match) return <span className="text-neutral-300">—</span>;
  const time = match.scheduledAt ? pad(match.scheduledAt.getHours()) + ':' + pad(match.scheduledAt.getMinutes()) : '·';
  return (
    <MatchResult match={match} side={rowId} pending={<span className="text-[12px] tabular-nums text-neutral-400">{time}</span>} />
  );
}

function PlayerRow({
  player,
  seed,
  group,
  pairs,
  draggable,
  ranked,
}: {
  player: Player;
  seed: number;
  group: Group;
  pairs: Map<string, ScheduledMatch>;
  draggable: boolean;
  /** В группе есть итог хоть одного матча — места что-то значат. */
  ranked: boolean;
}) {
  // Берётся за ручку ⠿ (`setActivatorNodeRef`), а переносится имя — ручка с
  // фамилией (`setNodeRef`), не вся строка: копия под курсором шириной в имя,
  // бледнеет тоже только оно (решение владельца продукта).
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { from: group.id, name: player.name },
    disabled: !draggable,
  });
  const st = player.standing;
  const td = 'border-b border-neutral-100 px-3 py-2.5 text-center';
  return (
    <tr
      className="hover:bg-neutral-50"
      data-testid="schedule-group-player"
      data-id={player.id}
    >
      <td className="w-12 border-b border-neutral-100 py-2.5 pl-6 pr-2 tabular-nums text-neutral-500">{seed}</td>
      <td className="border-b border-neutral-100 px-3 py-2.5">
        <span
          ref={setNodeRef}
          className={'inline-flex max-w-full items-center gap-1.5 ' + (isDragging ? 'opacity-40' : '')}
          data-testid="schedule-name"
        >
          {draggable && (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={player.name + ' — перетащить в другую группу'}
              className="-ml-1 inline-flex shrink-0 cursor-grab touch-none rounded p-0.5 text-neutral-400 outline-none hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-blue-400"
              data-testid="schedule-drag"
            >
              <GripVertical size={14} aria-hidden />
            </button>
          )}
          <span className="truncate">{player.name}</span>
        </span>
      </td>
      {group.players.map((o) => (
        <td
          key={o.id}
          className={td + ' w-16 ' + (o.id === player.id ? 'bg-neutral-100' : '')}
          data-testid="schedule-cell"
          data-row={player.id}
          data-col={o.id}
        >
          {o.id === player.id ? null : <Cell match={pairs.get(pairKey(player.id, o.id))} rowId={player.id} />}
        </td>
      ))}
      <td className={td + ' tabular-nums'} data-testid="schedule-wins">{st.wins}</td>
      <td className={td + ' tabular-nums'}>{st.losses}</td>
      <td className={td + ' font-semibold tabular-nums'} data-testid="schedule-points">{st.points}</td>
      {/* До первого результата места нет — порядок посева местом не выглядит. */}
      <td className={td + ' w-16 pr-6 font-semibold tabular-nums'} data-testid="schedule-place">
        {ranked ? st.place : <span className="font-normal text-neutral-300">—</span>}
      </td>
    </tr>
  );
}

function GroupTable({
  group,
  matches,
  draggable,
  tone,
}: {
  group: Group;
  matches: ScheduledMatch[];
  draggable: boolean;
  tone: GroupTone;
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id: group.id });
  // Подсветка — только «чужой» группе: на свою бросать нечего.
  const target = isOver && active?.data.current?.from !== group.id;
  const pairs = useMemo(() => {
    const map = new Map<string, ScheduledMatch>();
    for (const m of matches) if (m.group === group.id) map.set(pairKey(m.player1.id, m.player2.id), m);
    return map;
  }, [matches, group.id]);
  const ranked = [...pairs.values()].some((m) => m.status === 'finished');
  const th = 'border-b border-neutral-200 bg-neutral-100 px-3 py-2 text-[12px] font-semibold text-neutral-500';
  return (
    <section
      ref={setNodeRef}
      className={'border-b border-neutral-200 ' + (target ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : '')}
      data-testid="schedule-group"
      data-group={group.name}
      data-over={target || undefined}
    >
      {/* Шапка — цветом группы (тем же, что её матчи в «Дне» и «Матчах»). */}
      <h3 className={'m-0 flex items-center gap-2.5 border-b border-neutral-200 px-6 py-2.5 text-[15px] font-semibold ' + tone.head}>
        <span className={'h-3 w-3 rounded-full ' + tone.bar} aria-hidden />
        Группа {group.name}
      </h3>
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr>
            <th className={th + ' pl-6 text-left'}>№</th>
            <th className={th + ' text-left'}>Игрок</th>
            {group.players.map((p, i) => (
              <th key={p.id} className={th + ' text-center'} title={p.name}>
                {i + 1}
              </th>
            ))}
            <th className={th + ' text-center'}>Победы</th>
            <th className={th + ' text-center'}>Поражения</th>
            <th className={th + ' text-center'}>Очки</th>
            <th className={th + ' pr-6 text-center'}>Место</th>
          </tr>
        </thead>
        <tbody>
          {group.players.map((p, i) => (
            <PlayerRow
              key={p.id}
              player={p}
              seed={i + 1}
              group={group}
              pairs={pairs}
              draggable={draggable}
              ranked={ranked}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ScheduleGroups({
  schedule,
  tournamentId,
  onChanged,
}: {
  schedule: Schedule;
  tournamentId: string;
  onChanged: (s: Schedule) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const draggable = schedule.canEdit && schedule.groups.length > 1;
  // Мышь — с порогом 5 px: щелчок по строке не начинает перенос.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const from = e.active.data.current?.from as number | undefined;
    if (!e.over || e.over.id === from) return;
    setError(null);
    try {
      onChanged(await moveScheduledPlayer(tournamentId, String(e.active.id), Number(e.over.id)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      {error && (
        <p className="m-0 px-6 py-3 text-[13px] text-red-600" data-testid="schedule-move-error">
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setDragging((e.active.data.current?.name as string) ?? null)}
        onDragCancel={() => setDragging(null)}
        onDragEnd={(e) => void onDragEnd(e)}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Пробел — взять игрока, стрелки — к группе, пробел — положить, Esc — отмена.',
          },
        }}
      >
        {schedule.groups.map((g) => (
          <GroupTable
            key={g.id}
            group={g}
            matches={schedule.matches}
            draggable={draggable}
            tone={groupTone(schedule.groups, g.id)}
          />
        ))}
        {/* Под курсором — карточка игрока, а строка в таблице бледнеет. */}
        <DragOverlay dropAnimation={null}>
          {/* Обёртка оверлея — размером с переносимое имя; копия заполняет её целиком. */}
          {dragging && (
            <div
              className="flex h-full w-full cursor-grabbing items-center gap-1.5 rounded-md bg-white text-[14px] shadow-lg ring-1 ring-blue-300"
              data-testid="schedule-drag-overlay"
            >
              <GripVertical size={14} className="shrink-0 text-neutral-400" aria-hidden />
              <span className="truncate">{dragging}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
