"use client";

import { useLang } from "@/lib/i18n";
import { usePushState } from "@/lib/usePushState";
import { Home, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/dashboard", key: "home" as const, Icon: Home },
  { href: "/dashboard/my", key: "tournaments" as const, Icon: Trophy },
  { href: "/dashboard/profile", key: "profile" as const, Icon: User },
] as const;

export default function FloatingTabBar({
  hasActiveMatch = false,
}: {
  hasActiveMatch?: boolean;
}) {
  const { t } = useLang();
  const { needsAttention: pushWarn } = usePushState();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(localStorage.getItem("tt_theme_mode") !== "light");
    const onChange = (e: Event) =>
      setIsDark((e as CustomEvent<string>).detail !== "light");
    window.addEventListener("tt_theme_change", onChange);
    return () => window.removeEventListener("tt_theme_change", onChange);
  }, []);

  // Near-opaque (not blurred): backdrop-filter corrupts scrolling content under
  // the bar on Mali GPUs (Honor/Huawei/many Android phones).
  const bg = isDark ? "rgba(16,18,34,0.96)" : "rgba(255,255,255,0.96)";
  const border = isDark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.10)";

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-40 flex items-center gap-1 p-1.5
                 rounded-[26px] border "
      style={{
        background: bg,
        borderColor: border,
        // Promote the fixed bar onto its own GPU layer. Without this, Mali GPUs
        // (Honor/Huawei) leave a corrupted "trail" in the scrolling content the
        // bar passes over. translateX(-50%) keeps it centred (it replaces the
        // -translate-x-1/2 class, which inline transform would otherwise clobber).
        transform: "translateX(-50%) translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      {/* top sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.40), transparent)",
        }}
      />

      {TABS.map(({ href, key, Icon }) => {
        const label = t[key];
        const active = pathname === href;
        const showDot = hasActiveMatch && href === "/dashboard/my" && !active;
        const showWarn = pushWarn && href === "/dashboard/profile" && !active;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-1
                        w-[78px] py-2.5 rounded-2xl transition-all active:scale-90 ${
                          active
                            ? "text-white bg-blue-600 shadow-[0_4px_16px_rgba(59,130,246,0.45)]"
                            : isDark
                              ? "text-white/45 hover:text-white/75"
                              : "text-[#0f172a]/45 hover:text-[#0f172a]/80"
                        }`}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {showDot && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-[var(--surface)] animate-pulse" />
              )}
              {showWarn && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[var(--surface)]" />
              )}
            </span>
            <span className="text-[10px] font-bold tracking-tight">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
