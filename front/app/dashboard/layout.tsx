"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import SpinCoachLogo from "@/components/SpinCoachLogo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setReady(true));
  }, []);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#09091a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500
                        rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 h-[52px] flex items-center
                   border-b border-white/[0.06]"
        style={{ background: "rgba(9,9,26,0.85)", backdropFilter: "blur(20px)" }}
      >
        <div className="w-full max-w-screen-xl mx-auto px-5 flex items-center justify-between">

          {/* Logo */}
          <SpinCoachLogo size="sm" />

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-none">
              <p className="text-[13px] font-semibold text-white/90">{user.name}</p>
              {user.is_staff && (
                <p className="text-[11px] text-blue-400 font-medium mt-0.5">Администратор</p>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-[13px] font-black text-white select-none shrink-0"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: "0 0 12px rgba(99,102,241,0.4)",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="w-px h-4 bg-white/[0.10]" />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8">
        {children}
      </main>
    </div>
  );
}
