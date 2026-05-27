"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Country {
  code: string;
  iso: string;
  flag: string;
  name: string;
  maxDigits: number;
}

const COUNTRIES: Country[] = [
  { code: "+7",   iso: "KZ", flag: "🇰🇿", name: "Казахстан",   maxDigits: 10 },
  { code: "+7",   iso: "RU", flag: "🇷🇺", name: "Россия",       maxDigits: 10 },
  { code: "+996", iso: "KG", flag: "🇰🇬", name: "Кыргызстан",  maxDigits: 9  },
  { code: "+998", iso: "UZ", flag: "🇺🇿", name: "Узбекистан",  maxDigits: 9  },
  { code: "+992", iso: "TJ", flag: "🇹🇯", name: "Таджикистан", maxDigits: 9  },
  { code: "+993", iso: "TM", flag: "🇹🇲", name: "Туркменистан",maxDigits: 8  },
  { code: "+994", iso: "AZ", flag: "🇦🇿", name: "Азербайджан", maxDigits: 9  },
  { code: "+374", iso: "AM", flag: "🇦🇲", name: "Армения",     maxDigits: 8  },
  { code: "+995", iso: "GE", flag: "🇬🇪", name: "Грузия",      maxDigits: 9  },
  { code: "+380", iso: "UA", flag: "🇺🇦", name: "Украина",     maxDigits: 9  },
  { code: "+375", iso: "BY", flag: "🇧🇾", name: "Беларусь",    maxDigits: 9  },
];

interface Props {
  /** Full international number like "+77001234567" */
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}

export default function PhoneInput({ value, onChange, required, autoFocus }: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [open, setOpen]       = useState(false);
  const wrapperRef            = useRef<HTMLDivElement>(null);

  // Extract local digits from the full value (strip dial code prefix)
  const localDigits = value.startsWith(country.code)
    ? value.slice(country.code.length).replace(/\D/g, "")
    : value.replace(/\D/g, "");

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, country.maxDigits);
    onChange(country.code + digits);
  }

  function selectCountry(c: Country) {
    setCountry(c);
    onChange(c.code); // reset digits when country changes
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Main pill */}
      <div className="flex items-center bg-white/10 border border-white/20 rounded-2xl overflow-hidden
        focus-within:border-blue-500 focus-within:bg-white/15 transition-all">

        {/* Country button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 pl-4 pr-3 py-3.5 shrink-0 border-r border-white/20
            hover:bg-white/5 transition-colors select-none"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-white/80 text-sm font-semibold">{country.code}</span>
          <ChevronDown
            size={13}
            className={`text-white/40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Digit input */}
        <input
          type="tel"
          inputMode="numeric"
          value={localDigits}
          onChange={handleInput}
          placeholder={"0".repeat(country.maxDigits)}
          required={required}
          autoFocus={autoFocus}
          maxLength={country.maxDigits}
          className="flex-1 bg-transparent px-4 py-3.5
            text-white placeholder:text-white/25 text-base outline-none tracking-wider"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-64
          bg-[#0d1b35] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
          {COUNTRIES.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => selectCountry(c)}
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
      )}
    </div>
  );
}
