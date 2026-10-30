'use client';

/* «День» — расписание сеткой дня ✳ (30.10.2026, решение владельца продукта;
   образец — дневной вид Google Календаря). Слева шкала времени игрового дня,
   столбцы — столы, матч — блок на своём столе от начала до конца (высота —
   длительность матча из параметров). Цвет блока — группа. Дни листаются
   стрелками; по умолчанию — сегодняшний, если он игровой, иначе первый.
   Щелчок по матчу у главного судьи в черновике — та же карточка справа, что в
   таблице. HeroUI + Tailwind. */

import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import type { Schedule, ScheduledMatch } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';

import { groupTone } from './groupTone';
import { MatchResult } from './MatchResult';

/** Пикселей на минуту: получасовой матч — 60 px, двух строк текста хватает. */
const PX = 2;


const pad = (n: number) => String(n).padStart(2, '0');
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dayTitle = (d: Date) =>
  capital(d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }));

export function ScheduleDay({
  schedule,
  toolbar,
  onOpen,
}: {
  schedule: Schedule;
  /** Полоса кнопок раздела — справа в шапке, как над таблицей. */
  toolbar: ReactNode;
  /** Матч открыт для правки; нет — только смотреть. */
  onOpen?: (id: number) => void;
}) {
  const { matches, settings, groups } = schedule;
  // Игровые дни расписания — по местной дате начала матчей.
  const days = useMemo(() => {
    const keys = [...new Set(matches.filter((m) => m.scheduledAt).map((m) => m.scheduledAt!.toDateString()))];
    return keys.map((k) => new Date(k)).sort((a, b) => +a - +b);
  }, [matches]);
  const [index, setIndex] = useState(() => {
    const today = days.findIndex((d) => d.toDateString() === new Date().toDateString());
    return today >= 0 ? today : 0;
  });
  const day = days[Math.min(index, days.length - 1)];

  // Матчи дня, которые занимают стол; неявка стола не занимает — её в сетке нет.
  const ofDay = day
    ? matches.filter((m) => m.scheduledAt && m.table && m.scheduledAt.toDateString() === day.toDateString())
    : [];
  // Шкала — часы этого игрового дня (у каждого дня свои). Матч, перенесённый
  // руками за край дня, растягивает шкалу, а не пропадает.
  const key = day ? day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate()) : '';
  const hoursOf = settings.days.find((d) => d.date === key) ?? settings.days[0];
  const at = (m: ScheduledMatch) => m.scheduledAt!.getHours() * 60 + m.scheduledAt!.getMinutes();
  const start = Math.min(minutesOf(hoursOf?.start ?? '10:00'), ...ofDay.map(at));
  const last = Math.max(minutesOf(hoursOf?.end ?? '18:00'), ...ofDay.map((m) => at(m) + settings.matchMinutes));
  const hours = Array.from({ length: Math.ceil((last - start) / 60) + 1 }, (_, i) => start + i * 60).filter((t) => t <= last);
  const tone = (m: ScheduledMatch) => groupTone(groups, m.group).block;
  const tables = Array.from({ length: settings.tables }, (_, i) => i + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="schedule-day">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Предыдущий день"
            className="rounded-xl"
            isDisabled={index <= 0}
            onPress={() => setIndex((i) => i - 1)}
            data-testid="schedule-day-prev"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Следующий день"
            className="rounded-xl"
            isDisabled={index >= days.length - 1}
            onPress={() => setIndex((i) => i + 1)}
            data-testid="schedule-day-next"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        <h2 className="m-0 text-[17px] font-semibold tracking-tight" data-testid="schedule-day-title">
          {day ? dayTitle(day) : '—'}
        </h2>
        <span className="text-[13px] text-neutral-500" data-testid="schedule-day-count">
          Матчей: {ofDay.length}
        </span>
        <div className="flex-1" />
        {toolbar}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `4rem repeat(${tables.length}, minmax(11rem, 1fr))` }}>
          {/* Шапка: столы. Прилипает при прокрутке. */}
          <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white" />
          {tables.map((t) => (
            <div
              key={t}
              className="sticky top-0 z-20 border-b border-l border-neutral-200 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-neutral-500"
            >
              Стол {t}
            </div>
          ))}

          {/* Шкала времени: подпись часа у его черты. */}
          <div className="relative" style={{ height: (last - start) * PX }}>
            {hours.map((t) => (
              <span
                key={t}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-neutral-500 first:translate-y-0"
                style={{ top: (t - start) * PX }}
              >
                {pad(Math.floor(t / 60))}:{pad(t % 60)}
              </span>
            ))}
          </div>

          {tables.map((t) => (
            <div key={t} className="relative border-l border-neutral-200" style={{ height: (last - start) * PX }} data-testid="schedule-day-table" data-table={t}>
              {hours.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-neutral-100" style={{ top: (h - start) * PX }} />
              ))}
              {ofDay
                .filter((m) => m.table === t)
                .map((m) => {
                  const top = (m.scheduledAt!.getHours() * 60 + m.scheduledAt!.getMinutes() - start) * PX;
                  const body = (
                    <>
                      <span className="flex items-center gap-2 text-[11px] font-semibold">
                        <span className="min-w-0 flex-1 truncate opacity-80">
                          {pad(m.scheduledAt!.getHours())}:{pad(m.scheduledAt!.getMinutes())} · Группа {m.groupName} · круг {m.round}
                        </span>
                        <MatchResult match={m} />
                      </span>
                      <span className="block truncate text-[12px] font-medium">
                        {shortName(m.player1.name)} — {shortName(m.player2.name)}
                      </span>
                      <span className="block truncate text-[11px] opacity-70">{m.referee ? shortName(m.referee.name) : 'судья не назначен'}</span>
                    </>
                  );
                  const cls =
                    'absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left ' +
                    tone(m) +
                    (onOpen ? ' cursor-pointer hover:brightness-95' : '');
                  const style = { top: top + 1, height: settings.matchMinutes * PX - 2 };
                  return onOpen ? (
                    <button
                      key={m.id}
                      type="button"
                      className={cls}
                      style={style}
                      onClick={() => onOpen(m.id)}
                      title={m.player1.name + ' — ' + m.player2.name}
                      data-testid="schedule-day-match"
                      data-id={m.id}
                    >
                      {body}
                    </button>
                  ) : (
                    <div key={m.id} className={cls} style={style} title={m.player1.name + ' — ' + m.player2.name} data-testid="schedule-day-match" data-id={m.id}>
                      {body}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
