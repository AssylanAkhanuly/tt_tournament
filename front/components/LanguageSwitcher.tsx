"use client";

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

  // ── Native <select> overlay — taps work reliably on every mobile OS. ──────
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold
                     text-white/70 border border-white/[0.08] ${className ?? ""}`}>
      {current.label}
      <ChevronDown size={11} className="text-white/40" />
      <select
        aria-label="Язык"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
      >
        {LANGS.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
    </div>
  );
}
