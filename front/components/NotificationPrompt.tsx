"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { usePushState } from "@/lib/usePushState";
import { iosNeedsInstall } from "@/lib/push";

const DISMISS_KEY = "tt_push_prompt_dismissed";

/** First-visit banner nudging the player to enable push. On iOS Safari (where
 *  push needs the app installed to the Home Screen first) it shows install
 *  instructions instead of an enable button. Shows once until dismissed/enabled. */
export default function NotificationPrompt() {
  const { t } = useLang();
  const { needsEnable, busy, enable } = usePushState();
  const [dismissed, setDismissed] = useState(true); // hidden until we read storage (no SSR flash)
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setIosInstall(iosNeedsInstall());
  }, []);

  if (dismissed || (!needsEnable && !iosInstall)) return null;

  function close() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }
  async function handleEnable() {
    await enable();
    close();
  }

  // ── iOS: needs Home-Screen install before push works ──────────────────────
  if (iosInstall) {
    return (
      <div className="mb-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10
                      px-4 py-3.5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-white">Уведомления на iPhone</p>
          <p className="text-[12px] text-white/55 mt-0.5 leading-snug">
            Чтобы получать push-уведомления, добавьте приложение на экран «Домой»:
          </p>
          <ol className="text-[12px] text-white/70 mt-1.5 space-y-0.5">
            <li>1. Нажмите <span className="font-semibold">Поделиться</span> в Safari (квадрат со стрелкой ↑)</li>
            <li>2. Выберите <span className="font-semibold">«На экран „Домой"»</span></li>
            <li>3. Откройте SpinCoach с экрана «Домой» и включите уведомления</li>
          </ol>
          <button onClick={close}
            className="mt-2.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">
            {t.later}
          </button>
        </div>
        <button onClick={close} aria-label="close" className="text-white/30 hover:text-white/70 transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>
    );
  }

  // ── Everywhere else: one-tap enable ───────────────────────────────────────
  return (
    <div className="mb-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10
                    px-4 py-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
        <Bell size={18} className="text-blue-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-white">{t.notify_prompt_title}</p>
        <p className="text-[12px] text-white/55 mt-0.5 leading-snug">{t.notify_prompt_body}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <button onClick={handleEnable} disabled={busy}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-500
                       disabled:opacity-60 transition-colors">
            {busy ? "…" : t.enable}
          </button>
          <button onClick={close}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">
            {t.later}
          </button>
        </div>
      </div>
      <button onClick={close} aria-label="close" className="text-white/30 hover:text-white/70 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
