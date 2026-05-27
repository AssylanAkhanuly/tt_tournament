"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface Country {
  code: string;
  iso: string;
  flag: string;
  name: string;
  groups: number[];
}

const COUNTRIES: Country[] = [
  { code: "+7",   iso: "KZ", flag: "🇰🇿", name: "Казахстан",    groups: [3, 3, 2, 2] },
  { code: "+7",   iso: "RU", flag: "🇷🇺", name: "Россия",        groups: [3, 3, 2, 2] },
  { code: "+996", iso: "KG", flag: "🇰🇬", name: "Кыргызстан",   groups: [3, 2, 2, 2] },
  { code: "+998", iso: "UZ", flag: "🇺🇿", name: "Узбекистан",   groups: [2, 3, 2, 2] },
  { code: "+992", iso: "TJ", flag: "🇹🇯", name: "Таджикистан",  groups: [3, 2, 2, 2] },
  { code: "+993", iso: "TM", flag: "🇹🇲", name: "Туркменистан", groups: [2, 2, 2, 2] },
  { code: "+994", iso: "AZ", flag: "🇦🇿", name: "Азербайджан",  groups: [2, 3, 2, 2] },
  { code: "+374", iso: "AM", flag: "🇦🇲", name: "Армения",      groups: [2, 6]       },
  { code: "+995", iso: "GE", flag: "🇬🇪", name: "Грузия",       groups: [3, 2, 2, 2] },
  { code: "+380", iso: "UA", flag: "🇺🇦", name: "Украина",      groups: [2, 3, 2, 2] },
  { code: "+375", iso: "BY", flag: "🇧🇾", name: "Беларусь",     groups: [2, 3, 2, 2] },
];

function formatDigits(digits: string, groups: number[]): string {
  const max = groups.reduce((s, n) => s + n, 0);
  const d = digits.slice(0, max);
  const parts: string[] = [];
  let pos = 0;
  for (const g of groups) {
    const chunk = d.slice(pos, pos + g);
    if (!chunk) break;
    parts.push(chunk);
    pos += g;
  }
  if (parts.length === 0) return "";
  const [first, ...rest] = parts;
  return `(${first})` + (rest.length ? " " + rest.join("-") : "");
}

function digitsOnly(s: string) { return s.replace(/\D/g, ""); }

interface Props {
  value: string;
  onChange: (val: string) => void;
  /** Called with true when digit count equals country max, false otherwise */
  onComplete?: (complete: boolean) => void;
  required?: boolean;
  autoFocus?: boolean;
}

export default function PhoneInput({ value, onChange, onComplete, required, autoFocus }: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [open, setOpen]       = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef            = useRef<HTMLDivElement>(null);

  const maxDigits = country.groups.reduce((s, n) => s + n, 0);
  const rawDigits = value.startsWith(country.code)
    ? digitsOnly(value.slice(country.code.length))
    : digitsOnly(value);

  const formatted = formatDigits(rawDigits, country.groups);

  // Notify parent whenever completeness changes
  useEffect(() => {
    onComplete?.(rawDigits.length === maxDigits);
  }, [rawDigits.length, maxDigits, onComplete]);

  const updatePos = useCallback(() => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        const portal = document.getElementById("phone-dropdown-portal");
        if (portal && portal.contains(target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  // Desktop: intercept Backspace before the browser touches the value.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(country.code + rawDigits.slice(0, -1));
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const ie = e.nativeEvent as InputEvent;
    // Mobile virtual keyboards (Gboard, etc.) don't fire keydown with
    // key="Backspace". Instead they modify the value and fire the input
    // event with inputType="deleteContentBackward".
    // At this point rawDigits is still the OLD value (React hasn't
    // re-rendered yet), so slicing it gives the correct result regardless
    // of which character the browser happened to delete from the formatted
    // string (e.g. the ')' in '(777)').
    if (ie.inputType === "deleteContentBackward") {
      onChange(country.code + rawDigits.slice(0, -1));
      return;
    }
    const digits = digitsOnly(e.target.value).slice(0, maxDigits);
    onChange(country.code + digits);
  }

  function selectCountry(c: Country) {
    setCountry(c);
    onChange(c.code);
    setOpen(false);
  }

  const dropdown = open ? (
    <div
      id="phone-dropdown-portal"
      style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
      className="bg-[#0d1b35] border border-white/15 rounded-2xl shadow-2xl overflow-y-auto overscroll-contain max-h-64"
    >
      {COUNTRIES.map((c) => (
        <button
          key={c.iso}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectCountry(c); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
            hover:bg-white/10 transition-colors
            ${country.iso === c.iso ? "bg-blue-600/20" : ""}`}
        >
          <span className="text-lg leading-none">{c.flag}</span>
          <span className="text-white/85 text-sm flex-1">{c.name}</span>
          <span className="text-white/45 text-xs font-mono">{c.code}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className="flex items-center bg-white/10 border border-white/20 rounded-2xl overflow-hidden
          focus-within:border-blue-500 focus-within:bg-white/15 transition-all"
      >
        <button
          type="button"
          onClick={() => { updatePos(); setOpen(v => !v); }}
          className="flex items-center gap-1.5 pl-5 pr-3 py-3.5 shrink-0 border-r border-white/20
            hover:bg-white/5 transition-colors select-none"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-white/80 text-sm font-semibold">{country.code}</span>
          <ChevronDown size={13} className={`text-white/40 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>

        <input
          type="tel"
          inputMode="numeric"
          value={formatted}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={formatDigits("0".repeat(maxDigits), country.groups)}
          required={required}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent px-4 py-3.5
            text-white placeholder:text-white/25 text-base outline-none"
        />
      </div>

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </>
  );
}
