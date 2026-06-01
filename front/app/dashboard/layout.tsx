"use client";

import FloatingTabBar from "@/components/FloatingTabBar";
import MatchPrompts from "@/components/MatchPrompts";
import NotificationBell from "@/components/NotificationBell";
import NotificationPrompt from "@/components/NotificationPrompt";
import SpinCoachLogo from "@/components/SpinCoachLogo";
import { Toaster } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { User } from "@/lib/types";
import { useActiveMatch } from "@/lib/useActiveMatch";
import { usePushState } from "@/lib/usePushState";
import { useThemeMode } from "@/lib/useThemeMode";
import { Home, Trophy, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TAB_PATHS = ["/dashboard", "/dashboard/my", "/dashboard/profile"];

function isClubAdminOnly(user: User) {
  return !user.is_staff && user.club_ids_admin.length > 0;
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({
  pathname,
  user,
  hasActiveMatch,
}: {
  pathname: string;
  user: User;
  hasActiveMatch: boolean;
}) {
  const { t } = useLang();
  const { needsAttention: pushWarn } = usePushState();
  const adminOnly = isClubAdminOnly(user);

  const NAV = [
    { href: "/dashboard", label: t.home, Icon: Home, show: true, dot: false, warn: false },
    {
      href: "/dashboard/my",
      label: t.my_tournaments,
      Icon: Trophy,
      show: !adminOnly,
      dot: hasActiveMatch,
      warn: false,
    },
    {
      href: "/dashboard/profile",
      label: t.profile,
      Icon: UserIcon,
      show: !adminOnly,
      dot: false,
      warn: pushWarn,
    },
  ].filter((n) => n.show);

  const AVATAR_GRADIENTS = [
    ["#3b82f6", "#6366f1"],
    ["#06b6d4", "#3b82f6"],
    ["#8b5cf6", "#ec4899"],
    ["#10b981", "#06b6d4"],
    ["#f59e0b", "#ef4444"],
    ["#22c55e", "#3b82f6"],
  ];
  let h = 0;
  for (const c of user.name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const [g1, g2] = AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];

  return (
    <aside className="hidden sm:flex flex-col w-[200px] xl:w-[220px] shrink-0 border-r border-white/[0.06] py-4 overflow-y-auto">
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, Icon, dot, warn }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-blue-600/[0.14] text-white"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
              }`}
            >
              {active && (
                <span className="absolute left-0 w-[3px] h-5 bg-blue-500 rounded-r-full" />
              )}
              <span className="relative shrink-0">
                <Icon
                  size={17}
                  className={active ? "text-blue-400" : "text-white/50"}
                />
                {dot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[var(--bg)] animate-pulse" />
                )}
                {!dot && warn && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[var(--bg)]" />
                )}
              </span>
              <span className="text-[14px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div
        className="mx-2 mt-4 px-3 py-3 rounded-xl border border-white/[0.07] flex items-center gap-2.5"
        style={{ background: "var(--elevated)" }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px]
                          font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white truncate">
            {user.name}
          </p>
          {!adminOnly && (
            <p className="text-[11px] text-white/40 tabular-nums">
              R{user.rating}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme: themeMode } = useThemeMode();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const showNav = TAB_PATHS.includes(pathname);
  const { match: activeMatch, refresh: refreshActiveMatch } = useActiveMatch(user ? !isClubAdminOnly(user) : false);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 h-[52px] flex items-center border-b border-white/[0.06]"
        style={{
          // No backdrop-filter: blur corrupts scrolling content on Mali GPUs
          // (Honor/Huawei and many other Android phones). A near-opaque
          // background gives the same look without the rendering bug.
          background:
            themeMode === "light"
              ? "rgba(255,255,255,0.97)"
              : "rgba(9,9,26,0.97)",
        }}
      >
        <div className="w-full max-w-screen-xl mx-auto px-5 flex items-center justify-between">
          <SpinCoachLogo
            size="sm"
            variant={themeMode === "light" ? "light" : "dark"}
          />

          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {showNav ? (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <DesktopSidebar
            pathname={pathname}
            user={user}
            hasActiveMatch={!!activeMatch}
          />
          <main className="flex-1 overflow-y-auto px-5 py-6 pb-28 sm:px-8 sm:py-8 sm:pb-8">
            <NotificationPrompt />
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
          <FloatingTabBar hasActiveMatch={!!activeMatch} />
        </div>
      )}

      {/* App-wide match prompts (your live match / confirm the opponent's score) */}
      <MatchPrompts match={activeMatch} refresh={refreshActiveMatch} />
      <Toaster position="top-center" theme="dark" offset="64px" />
    </div>
  );
}
