"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLang, Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "kz", label: "KZ" },
];

interface Props {
  variant?: "pills" | "select";
  className?: string;
}

export default function LanguageSwitcher({ variant = "pills", className }: Props) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (variant === "pills") {
    return (
      <div className={`flex items-center gap-1 ${className ?? ""}`}>
        {LANGS.map(({ code, label }) => (
          <button key={code} onClick={() => setLang(code)}
            className={`text-[12px] font-bold px-2 py-1 rounded-lg transition-all ${
              lang === code
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                : "text-white/40 hover:text-white/75 hover:bg-white/[0.05] border border-transparent"
            }`}>
            {label}
          </button>
        ))}
      </div>
    );
  }

  // ── Select dropdown variant ──────────────────────────────────────────────
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold
                   text-white/60 hover:text-white/90 hover:bg-white/[0.07] border border-white/[0.08]
                   hover:border-white/[0.15] transition-all">
        {current.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-20 rounded-xl border border-white/[0.09]
                        shadow-xl overflow-hidden z-50"
             style={{ background: "var(--elevated)" }}>
          {LANGS.map(({ code, label }) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }}
              className={`w-full px-3 py-2 text-[12px] font-bold text-left transition-colors ${
                lang === code
                  ? "text-blue-300 bg-blue-600/10"
                  : "text-white/55 hover:text-white hover:bg-white/[0.06]"
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
