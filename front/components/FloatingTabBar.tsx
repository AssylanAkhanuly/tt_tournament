"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Trophy, User } from "lucide-react";

const TABS = [
  { href: "/dashboard",         label: "Главная",     Icon: Home },
  { href: "/dashboard/my",      label: "Турниры",     Icon: Trophy },
  { href: "/dashboard/profile", label: "Профиль",     Icon: User },
] as const;

export default function FloatingTabBar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(localStorage.getItem("tt_theme_mode") !== "light");
    const onChange = (e: Event) => setIsDark((e as CustomEvent<string>).detail !== "light");
    window.addEventListener("tt_theme_change", onChange);
    return () => window.removeEventListener("tt_theme_change", onChange);
  }, []);

  const bg     = isDark ? "rgba(16,18,34,0.80)" : "rgba(255,255,255,0.80)";
  const border = isDark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.10)";

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5
                 rounded-[26px] border shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
      style={{
        background: bg,
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderColor: border,
      }}
    >
      {/* top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full"
           style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.40), transparent)" }} />

      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
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
                : isDark ? "text-white/45 hover:text-white/75" : "text-[#0f172a]/45 hover:text-[#0f172a]/80"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
