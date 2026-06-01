"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check } from "lucide-react";
import { api, AppNotification } from "@/lib/api";
import { currentPushState, enablePush, iosNeedsInstall, pushSupported, PushState } from "@/lib/push";

const POLL_MS = 15000;

export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState>("default");
  const [iosInstall, setIosInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch { /* offline — keep last state */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (pushSupported()) currentPushState().then(setPushState);
    setIosInstall(iosNeedsInstall());
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markAllRead() {
    if (unread === 0) return;
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, is_read: true })));
    try { await api.markNotificationsRead(); } catch { /* ignore */ }
  }

  async function openNotification(n: AppNotification) {
    setOpen(false);
    if (!n.is_read) {
      try { await api.markNotificationsRead([n.id]); } catch { /* ignore */ }
    }
    if (n.tournament) router.push(`/dashboard/tournaments/${n.tournament}`);
  }

  async function handleEnablePush() {
    setBusy(true);
    try {
      await enablePush();
      setPushState(await currentPushState());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        className="relative w-8 h-8 rounded-full flex items-center justify-center
                   bg-white/[0.07] hover:bg-white/[0.13] text-white/50 hover:text-white transition-all"
        aria-label="Уведомления"
        title="Уведомления"
      >
        {unread > 0 ? <BellRing size={15} /> : <Bell size={15} />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500
                           text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] max-w-[88vw] rounded-2xl
                        border border-white/[0.09] shadow-2xl overflow-hidden z-50"
             style={{ background: "var(--elevated)" }}>
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Уведомления</p>
            {unread > 0 && (
              <button onClick={markAllRead}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Check size={12} /> Прочитать все
              </button>
            )}
          </div>

          {pushSupported() && pushState !== "subscribed" && pushState !== "denied" && (
            <button onClick={handleEnablePush} disabled={busy}
              className="w-full px-4 py-2.5 text-left text-[12px] text-blue-300 hover:bg-white/[0.05]
                         border-b border-white/[0.06] disabled:opacity-50 transition-colors">
              {busy ? "Включаем…" : "🔔 Включить push-уведомления на этом устройстве"}
            </button>
          )}
          {pushState === "denied" && (
            <p className="px-4 py-2.5 text-[11px] text-white/40 border-b border-white/[0.06]">
              Push заблокирован в настройках браузера.
            </p>
          )}
          {iosInstall && (
            <div className="px-4 py-3 border-b border-white/[0.06] space-y-1.5">
              <p className="text-[12px] font-bold text-blue-300">🔔 Уведомления на iPhone</p>
              <p className="text-[11px] text-white/55">
                Чтобы получать push, добавьте приложение на экран «Домой»:
              </p>
              <ol className="text-[11px] text-white/70 space-y-1">
                <li>1. Нажмите <span className="font-semibold">Поделиться</span> в Safari (квадрат со стрелкой ↑)</li>
                <li>2. Выберите <span className="font-semibold">«На экран „Домой"»</span></li>
                <li>3. Откройте SpinCoach с экрана «Домой» и включите уведомления</li>
              </ol>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-white/40">Пока нет уведомлений</p>
            ) : (
              items.map((n) => (
                <button key={n.id} onClick={() => openNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors
                              hover:bg-white/[0.05] ${n.is_read ? "" : "bg-blue-500/[0.06]"}`}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                    <div className={`min-w-0 ${n.is_read ? "pl-3.5" : ""}`}>
                      <p className="text-[13px] font-semibold text-white truncate">{n.title}</p>
                      {n.body && <p className="text-[12px] text-white/55 leading-snug">{n.body}</p>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
