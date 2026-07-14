"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import type { EventDropArg } from "@fullcalendar/core";
import type {
  EventClickArg, DateSelectArg, EventContentArg,
} from "@fullcalendar/core";
import ruLocale from "@fullcalendar/core/locales/ru";
import { useRouter } from "next/navigation";
import { Plus, X, Calendar, Building2, Check } from "lucide-react";
import { Club, Tournament } from "@/lib/types";
import { api } from "@/lib/api";

// ── Tournament → FC event object ─────────────────────────────────────────────
function toFCEvent(t: Tournament) {
  const c = STATUS_FC[t.status];
  return {
    id:              t.id,
    title:           t.name,
    start:           t.starts_at!,
    backgroundColor: c.bg,
    borderColor:     c.border,
    textColor:       c.text,
    extendedProps:   { status: t.status, tournament: t },
  };
}
function toFCEvents(ts: Tournament[]) {
  return ts.filter((t) => t.starts_at).map(toFCEvent);
}

// ── Status → FullCalendar event colors ───────────────────────────────────────
const STATUS_FC = {
  open:        { bg: "rgba(34,197,94,0.22)",  border: "var(--success)", text: "var(--success)" },
  in_progress: { bg: "rgba(6,182,212,0.22)",  border: "var(--live)",    text: "var(--live)" },
  finished:    { bg: "var(--border)",          border: "var(--border-hi)", text: "var(--text-2)" },
};

// ── Custom event content ──────────────────────────────────────────────────────
function EventChip({ info }: { info: EventContentArg }) {
  const status = info.event.extendedProps.status as keyof typeof STATUS_FC;
  return (
    <div className="flex items-center gap-1 px-1 py-[1px] w-full overflow-hidden">
      {status === "in_progress" && (
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
      )}
      {info.timeText && (
        <span className="text-[10px] opacity-70 shrink-0">{info.timeText}</span>
      )}
      <span className="truncate text-[11px] font-semibold">{info.event.title}</span>
    </div>
  );
}

// ── Create tournament modal ───────────────────────────────────────────────────
const FINPUT = "w-full px-4 py-3 bg-white/[0.07] border border-white/[0.10] rounded-xl text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]";

function CreateModal({
  clubs, initialDate, onCreated, onClose,
}: {
  clubs: Club[];
  initialDate: string;
  onCreated: (t: Tournament) => void;
  onClose: () => void;
}) {
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [startsAt, setStartsAt] = useState(initialDate);
  const [clubId,   setClubId]   = useState(clubs[0]?.id ?? "");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const t = await api.createTournament({
        name: name.trim(),
        description: desc.trim() || undefined,
        starts_at: startsAt || undefined,
        club_id: clubId || undefined,
      });
      onCreated(t);
    } catch (err: unknown) {
      setError((err as Record<string, string>)?.detail ?? "Ошибка создания.");
    } finally { setLoading(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden"
           style={{ background: "var(--elevated)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <p className="text-[15px] font-bold text-white">Новый турнир</p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                       flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-5 space-y-3">
          {clubs.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 flex items-center gap-1.5">
                <Building2 size={10} />Клуб
              </label>
              <select value={clubId} onChange={(e) => setClubId(e.target.value)}
                className={FINPUT + " [color-scheme:dark]"}>
                {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Название турнира *" required autoFocus className={FINPUT} />

          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Описание (необязательно)" rows={2}
            className={FINPUT + " resize-none"} />

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 flex items-center gap-1.5">
              <Calendar size={10} />Дата начала
            </label>
            <input type="datetime-local" value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)} className={FINPUT} />
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                          rounded-xl px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button type="submit" disabled={loading || !name.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.98]
                         disabled:opacity-35 text-white font-bold text-[14px] transition-all
                         flex items-center justify-center gap-2"
              style={{ boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}>
              {loading ? "Создание..." : <><Check size={15} />Создать</>}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.11]
                         text-white/55 font-semibold text-[14px] transition-all">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event detail popover ──────────────────────────────────────────────────────
function EventPopover({
  tournament, x, y, onClose,
}: {
  tournament: Tournament; x: number; y: number; onClose: () => void;
}) {
  const router = useRouter();
  const status = tournament.status;
  const statusLabel = { open: "Открыт", in_progress: "Live", finished: "Завершён" }[status];
  const statusColor = {
    open: "text-emerald-300 bg-emerald-500/15",
    in_progress: "text-cyan-300 bg-cyan-500/15",
    finished: "text-white/30 bg-white/[0.06]",
  }[status];

  const date = tournament.starts_at
    ? new Date(tournament.starts_at).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-72 rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden"
        style={{ background: "var(--elevated)", left: Math.min(x, window.innerWidth - 300), top: Math.min(y, window.innerHeight - 220) }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
            {status === "in_progress" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1 align-middle" />}
            {statusLabel}
          </span>
          <button onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-white/[0.10] flex items-center justify-center
                       text-white/35 hover:text-white transition-all">
            <X size={12} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          <p className="text-[15px] font-bold text-white leading-snug">{tournament.name}</p>
          {date && <p className="text-[12px] text-white/35 flex items-center gap-1.5"><Calendar size={11} />{date}</p>}
          {tournament.description && (
            <p className="text-[12px] text-white/45 leading-relaxed">{tournament.description}</p>
          )}
          <div className="flex items-center gap-3 text-[12px] text-white/30 pt-1">
            <span>{tournament.participant_count} участников</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => router.push(`/dashboard/tournaments/${tournament.id}`)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white
                       font-semibold text-[13px] transition-all active:scale-[.97]">
            Открыть турнир
          </button>
        </div>
      </div>
    </>
  );
}

// ── Unscheduled sidebar ───────────────────────────────────────────────────────
function UnscheduledList({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) return null;
  return (
    <div className="w-52 shrink-0 flex flex-col border-l border-white/[0.07]"
         style={{ background: "var(--surface)" }}>
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
          Без даты · {tournaments.length}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {tournaments.map((t) => {
          const colors = STATUS_FC[t.status];
          return (
            <div key={t.id}
              className="fc-event-unscheduled rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing
                         border-l-[3px] select-none hover:brightness-125 transition-all"
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
              data-event={JSON.stringify({ id: t.id, title: t.name, extendedProps: { status: t.status } })}
            >
              <p className="text-[12px] font-semibold truncate">{t.name}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{t.participant_count} уч.</p>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/20 text-center px-3 py-3 border-t border-white/[0.05] shrink-0">
        Перетащите на календарь
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  clubs: Club[];
  tournaments: Tournament[];
  onTournamentCreated: (t: Tournament) => void;
  onTournamentUpdated: (t: Tournament) => void;
}

export default function TournamentCalendar({
  clubs, tournaments, onTournamentCreated, onTournamentUpdated,
}: Props) {
  const calRef = useRef<FullCalendar>(null);
  const [createDate,  setCreateDate]  = useState<string | null>(null);
  const [popover,     setPopover]     = useState<{ t: Tournament; x: number; y: number } | null>(null);
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() =>
    typeof window === "undefined" || localStorage.getItem("tt_theme_mode") !== "light"
  );

  useEffect(() => {
    function onThemeChange(e: Event) {
      setIsDark((e as CustomEvent<string>).detail !== "light");
    }
    window.addEventListener("tt_theme_change", onThemeChange);
    return () => window.removeEventListener("tt_theme_change", onThemeChange);
  }, []);

  // Local FC events — decoupled from parent tournaments so a prop change
  // after a successful drop doesn't re-position an event FullCalendar already moved.
  const [fcEvents, setFcEvents] = useState(() => toFCEvents(tournaments));
  const droppingIds = useRef(new Set<string>());

  useEffect(() => {
    setFcEvents((prev) => {
      const next = toFCEvents(tournaments);
      if (droppingIds.current.size === 0) return next;
      // Keep FC's optimistic position for events mid-drop
      return next.map((e) =>
        droppingIds.current.has(e.id) ? (prev.find((p) => p.id === e.id) ?? e) : e
      );
    });
  }, [tournaments]);

  const unscheduled = tournaments.filter((t) => !t.starts_at);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    // datetime-local needs "YYYY-MM-DDTHH:mm"
    const iso = arg.date.toISOString().slice(0, 16);
    setCreateDate(iso);
  }, []);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const iso = arg.start.toISOString().slice(0, 16);
    setCreateDate(iso);
    calRef.current?.getApi().unselect();
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    const t = arg.event.extendedProps.tournament as Tournament;
    const rect = (arg.jsEvent.target as HTMLElement).getBoundingClientRect();
    setPopover({ t, x: rect.left, y: rect.bottom + 4 });
  }, []);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const newStart = arg.event.start;
    if (!newStart) { arg.revert(); return; }
    droppingIds.current.add(arg.event.id);
    setSavingId(arg.event.id);
    try {
      const updated = await api.updateTournament(arg.event.id, { starts_at: newStart.toISOString() });
      onTournamentUpdated(updated);
      // Release the lock after React has flushed the prop update
      setTimeout(() => droppingIds.current.delete(arg.event.id), 50);
    } catch {
      droppingIds.current.delete(arg.event.id);
      arg.revert();
    } finally { setSavingId(null); }
  }, [onTournamentUpdated]);

  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    const newStart = arg.event.start;
    if (!newStart) { arg.revert(); return; }
    droppingIds.current.add(arg.event.id);
    setSavingId(arg.event.id);
    try {
      const updated = await api.updateTournament(arg.event.id, { starts_at: newStart.toISOString() });
      onTournamentUpdated(updated);
      setTimeout(() => droppingIds.current.delete(arg.event.id), 50);
    } catch {
      droppingIds.current.delete(arg.event.id);
      arg.revert();
    } finally { setSavingId(null); }
  }, [onTournamentUpdated]);

  const handleExternalDrop = useCallback(async (info: { date: Date; draggedEl: HTMLElement }) => {
    const raw = info.draggedEl.dataset.event;
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { id: string };
      const updated = await api.updateTournament(data.id, {
        starts_at: info.date.toISOString(),
      });
      onTournamentUpdated(updated);
    } catch { /* silent */ }
  }, [onTournamentUpdated]);

  return (
    <div className="flex h-full min-h-0 gap-0">

      {/* ── Calendar ── */}
      <div className={`flex-1 min-w-0 relative ${isDark ? "fc-dark" : "fc-light"}`}>
        {savingId && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5
                          rounded-xl bg-blue-600/90 text-white text-[12px] font-semibold
                          backdrop-blur-sm shadow-lg">
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Сохранение...
          </div>
        )}

        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locales={[ruLocale]}
          locale="ru"
          firstDay={1}
          events={fcEvents}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          navLinks={true}
          navLinkDayClick="timeGridDay"
          navLinkWeekClick="timeGridWeek"
          dayMaxEvents={4}
          weekends={true}
          height="100%"
          headerToolbar={{
            left:   "prev,next today",
            center: "title",
            right:  "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Сегодня",
            month: "Месяц",
            week:  "Неделя",
            day:   "День",
            list:  "Список",
          }}
          eventContent={(info) => <EventChip info={info} />}
          dateClick={handleDateClick}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          drop={(info) => handleExternalDrop({
            date: info.date,
            draggedEl: info.draggedEl,
          })}
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
          moreLinkContent={(args) => `+${args.num} ещё`}
        />
      </div>

      {/* ── Unscheduled sidebar ── */}
      <UnscheduledList tournaments={unscheduled} />

      {/* ── Create modal ── */}
      {createDate && (
        <CreateModal
          clubs={clubs}
          initialDate={createDate}
          onCreated={(t) => { onTournamentCreated(t); setCreateDate(null); }}
          onClose={() => setCreateDate(null)}
        />
      )}

      {/* ── Event popover ── */}
      {popover && (
        <EventPopover
          tournament={popover.t}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
        />
      )}

      {/* Inline add button hint */}
      <button
        onClick={() => setCreateDate(new Date().toISOString().slice(0, 16))}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-blue-600
                   hover:bg-blue-500 active:scale-[.94] flex items-center justify-center
                   shadow-xl transition-all"
        style={{ boxShadow: "0 4px 24px rgba(59,130,246,0.55)" }}
        title="Новый турнир"
      >
        <Plus size={22} className="text-white" />
      </button>
    </div>
  );
}
