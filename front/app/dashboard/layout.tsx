"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Home, Trophy, User as UserIcon } from "lucide-react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import SpinCoachLogo from "@/components/SpinCoachLogo";
import FloatingTabBar from "@/components/FloatingTabBar";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const TAB_PATHS = ["/dashboard", "/dashboard/my", "/dashboard/profile"];

type ThemeMode = "dark" | "light";
const THEME_KEY   = "tt_theme_mode";
export const THEME_EVENT = "tt_theme_change";

function isClubAdminOnly(user: User) {
  return !user.is_staff && user.club_ids_admin.length > 0;
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ pathname, user }: { pathname: string; user: User }) {
  const { t } = useLang();
  const adminOnly = isClubAdminOnly(user);

  const NAV = [
    { href: "/dashboard",         label: t.home,           Icon: Home,     show: true },
    { href: "/dashboard/my",      label: t.my_tournaments, Icon: Trophy,   show: !adminOnly },
    { href: "/dashboard/profile", label: t.profile,        Icon: UserIcon, show: !adminOnly },
  ].filter((n) => n.show);

  const AVATAR_GRADIENTS = [
    ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
    ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
  ];
  let h = 0; for (const c of user.name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const [g1, g2] = AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];

  return (
    <aside className="hidden sm:flex flex-col w-[200px] xl:w-[220px] shrink-0 border-r border-white/[0.06] py-4 overflow-y-auto">
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-blue-600/[0.14] text-white"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
              }`}>
              {active && (
                <span className="absolute left-0 w-[3px] h-5 bg-blue-500 rounded-r-full" />
              )}
              <Icon size={17} className={`shrink-0 ${active ? "text-blue-400" : "text-white/50"}`} />
              <span className="text-[14px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="mx-2 mt-4 px-3 py-3 rounded-xl border border-white/[0.07] flex items-center gap-2.5"
           style={{ background: "var(--elevated)" }}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name}
            className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px]
                          font-black text-white shrink-0"
               style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white truncate">{user.name}</p>
          {!adminOnly && (
            <p className="text-[11px] text-white/40 tabular-nums">R{user.rating}</p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const [user, setUser]   = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const pathname = usePathname();
  const showNav = TAB_PATHS.includes(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    setThemeMode(stored === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.body.classList.toggle("tt-theme-light", themeMode === "light");
    localStorage.setItem(THEME_KEY, themeMode);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: themeMode }));
  }, [themeMode]);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const adminOnly = isClubAdminOnly(user);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 h-[52px] flex items-center border-b border-white/[0.06]"
              style={{
                background: themeMode === "light" ? "rgba(255,255,255,0.92)" : "rgba(9,9,26,0.85)",
                backdropFilter: "blur(20px)",
              }}>
        <div className="w-full max-w-screen-xl mx-auto px-5 flex items-center justify-between">
          <SpinCoachLogo size="sm" variant={themeMode === "light" ? "light" : "dark"} />

          <div className="flex items-center gap-2">
            {/* Language dropdown */}
            <LanguageSwitcher variant="select" />

            {/* Theme toggle */}
            <button type="button" onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))}
              className="w-8 h-8 rounded-full flex items-center justify-center
                         bg-white/[0.07] hover:bg-white/[0.13] text-white/50 hover:text-white transition-all"
              title={themeMode === "dark" ? t.dark_theme : t.light_theme}>
              {themeMode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* User menu */}
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/[0.07] transition-all">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]
                                  font-black text-white select-none shrink-0"
                       style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left leading-none">
                  <p className="text-[13px] font-semibold text-white/90">{user.name}</p>
                  {user.is_staff && <p className="text-[10px] text-blue-400 font-medium mt-0.5">{t.administrator}</p>}
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl border border-white/[0.09]
                                shadow-2xl overflow-hidden z-50"
                     style={{ background: "var(--elevated)" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[13px] font-bold text-white truncate">{user.name}</p>
                    {!adminOnly && (
                      <p className="text-[11px] text-white/40 mt-0.5">R{user.rating}</p>
                    )}
                  </div>
                  {!adminOnly && (
                    <div className="py-1.5">
                      <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium
                                   text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <UserIcon size={14} className="shrink-0" />{t.profile}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {showNav ? (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <DesktopSidebar pathname={pathname} user={user} />
          <main className="flex-1 overflow-y-auto px-5 py-6 pb-28 sm:px-8 sm:py-8 sm:pb-8">
            {children}
          </main>
        </div>
      ) : (
        <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8">
          {children}
        </main>
      )}

      {showNav && (
        <div className="sm:hidden">
          <FloatingTabBar />
        </div>
      )}
    </div>
  );
}
