"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, BellOff, AlertTriangle, CheckCircle2, Zap,
  ChevronRight, Check,
} from "lucide-react";
import { api, AppNotification } from "@/lib/api";
import { currentPushState, enablePush, iosNeedsInstall, pushSupported, PushState } from "@/lib/push";

const POLL_MS = 15000;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "match_ready") {
    return (
      <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
        <Zap size={18} className="text-blue-400" />
      </div>
    );
  }
  if (type === "score_proposed") {
    return (
      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
        <CheckCircle2 size={18} className="text-amber-400" />
      </div>
    );
  }
  if (type === "score_rejected") {
    return (
      <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
        <AlertTriangle size={17} className="text-red-400" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-white/[0.07] flex items-center justify-center shrink-0">
      <Bell size={17} className="text-white/40" />
    </div>
  );
}

export default function NotificationsClient() {
  const router = useRouter();
  const [items, setItems]           = useState<AppNotification[]>([]);
  const [unread, setUnread]         = useState(0);
  const [pushState, setPushState]   = useState<PushState>("default");
  const [iosInstall, setIosInstall] = useState(false);
  const [busy, setBusy]             = useState(false);

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
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
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

  const showPushCard =
    (pushSupported() && pushState !== "subscribed" && pushState !== "denied") ||
    pushState === "denied" ||
    iosInstall;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Page title + mark all */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-white">Уведомления</h1>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-400
                       hover:text-blue-300 active:opacity-70 transition-colors">
            <Check size={14} />Прочитать все
          </button>
        )}
      </div>

      {/* Push opt-in card */}
      {showPushCard && (
        <div className="rounded-2xl border overflow-hidden"
             style={{ background: "var(--card)", borderColor: "rgba(255,255,255,0.07)" }}>
          {pushSupported() && pushState !== "subscribed" && pushState !== "denied" && (
            <button onClick={handleEnablePush} disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-4
                         hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-left disabled:opacity-50">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">
                  {busy ? "Включаем…" : "Включить уведомления"}
                </p>
                <p className="text-[12px] text-white/45 mt-0.5">
                  Получайте оповещения о матчах в реальном времени
                </p>
              </div>
              {!busy && <ChevronRight size={16} className="text-white/25 shrink-0" />}
            </button>
          )}
          {pushState === "denied" && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center shrink-0">
                <BellOff size={17} className="text-white/35" />
              </div>
              <p className="text-[13px] text-white/45">
                Push-уведомления заблокированы в настройках браузера
              </p>
            </div>
          )}
          {iosInstall && (
            <div className="px-4 py-4 space-y-2 border-t border-white/[0.06]">
              <p className="text-[13px] font-semibold text-blue-300">🔔 Уведомления на iPhone</p>
              <p className="text-[12px] text-white/50 leading-relaxed">
                Добавьте приложение на экран «Домой», затем откройте и включите уведомления.
              </p>
              <ol className="text-[12px] text-white/60 space-y-0.5">
                <li>1. Нажмите <span className="font-semibold text-white/75">Поделиться</span> в Safari</li>
                <li>2. Выберите <span className="font-semibold text-white/75">«На экран „Домой"»</span></li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Notification list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/20">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center">
            <Bell size={28} />
          </div>
          <p className="text-[14px] font-medium">Уведомлений пока нет</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden divide-y"
             style={{ background: "var(--card)", borderColor: "rgba(255,255,255,0.07)", borderTopColor: "rgba(255,255,255,0.07)" }}>
          {items.map((n) => (
            <button key={n.id} onClick={() => openNotification(n)}
              className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors
                          hover:bg-white/[0.03] active:bg-white/[0.05]
                          ${!n.is_read ? "bg-blue-500/[0.05]" : ""}`}>

              {/* Icon */}
              <NotifIcon type={n.type} />

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[14px] leading-snug ${n.is_read ? "font-medium text-white/80" : "font-semibold text-white"}`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  )}
                </div>
                {n.body && (
                  <p className="text-[13px] text-white/45 mt-0.5 leading-snug">{n.body}</p>
                )}
                <p className="text-[11px] text-white/25 mt-1.5">
                  {timeAgo(n.created_at)}
                </p>
              </div>

              {n.tournament && (
                <ChevronRight size={15} className="text-white/20 shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
