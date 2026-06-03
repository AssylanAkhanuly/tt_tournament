"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { api, AppNotification } from "@/lib/api";
import { currentPushState, enablePush, iosNeedsInstall, pushSupported, PushState } from "@/lib/push";

const POLL_MS = 15000;

export default function NotificationsClient() {
  const router = useRouter();
  const [items, setItems]         = useState<AppNotification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [pushState, setPushState] = useState<PushState>("default");
  const [iosInstall, setIosInstall] = useState(false);
  const [busy, setBusy]           = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch { /* offline */ }
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

  async function markAllRead() {
    if (unread === 0) return;
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, is_read: true })));
    try { await api.markNotificationsRead(); } catch { /* ignore */ }
  }

  async function openNotification(n: AppNotification) {
    if (!n.is_read) {
      setItems((xs) => xs.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 h-[52px] flex items-center gap-3 px-4 border-b border-white/[0.06]"
           style={{ background: "var(--bg)" }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full
                     text-white/50 hover:text-white hover:bg-white/[0.07] transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-[16px] font-bold text-white">Уведомления</h1>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-400
                       hover:text-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-500/10 transition-all">
            <Check size={13} />Прочитать все
          </button>
        )}
      </div>

      {/* Push opt-in */}
      {pushSupported() && pushState !== "subscribed" && pushState !== "denied" && (
        <button onClick={handleEnablePush} disabled={busy}
          className="mx-4 mt-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl
                     bg-blue-500/10 border border-blue-500/20 text-left
                     hover:bg-blue-500/15 active:scale-[.98] transition-all disabled:opacity-50">
          <Bell size={18} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-blue-300">
              {busy ? "Включаем…" : "Включить push-уведомления"}
            </p>
            <p className="text-[12px] text-white/45 mt-0.5">
              Получайте уведомления о матчах, даже когда приложение закрыто
            </p>
          </div>
        </button>
      )}
      {pushState === "denied" && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
          <p className="text-[12px] text-white/40">
            Push-уведомления заблокированы в настройках браузера.
          </p>
        </div>
      )}
      {iosInstall && (
        <div className="mx-4 mt-4 px-4 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
          <p className="text-[13px] font-bold text-blue-300">🔔 Уведомления на iPhone</p>
          <p className="text-[12px] text-white/55">
            Чтобы получать push, добавьте приложение на экран «Домой»:
          </p>
          <ol className="text-[12px] text-white/70 space-y-1">
            <li>1. Нажмите <span className="font-semibold">Поделиться</span> в Safari</li>
            <li>2. Выберите <span className="font-semibold">«На экран „Домой"»</span></li>
            <li>3. Откройте SpinCoach и включите уведомления</li>
          </ol>
        </div>
      )}

      {/* Notification list */}
      <div className="flex-1 mt-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/25">
            <Bell size={40} />
            <p className="text-[14px]">Пока нет уведомлений</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {items.map((n) => (
              <button key={n.id} onClick={() => openNotification(n)}
                className={`w-full text-left px-4 py-4 flex items-start gap-3
                            active:bg-white/[0.04] transition-colors
                            ${n.is_read ? "" : "bg-blue-500/[0.06]"}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  n.is_read ? "bg-transparent" : "bg-blue-400"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-white leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="text-[13px] text-white/50 mt-0.5 leading-snug">{n.body}</p>
                  )}
                </div>
                {n.tournament && (
                  <ArrowLeft size={14} className="rotate-180 text-white/25 shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
