"use client";

import { useEffect, useState } from "react";
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

  const maxDigits = country.groups.reduce((s, n) => s + n, 0);
  const rawDigits = (value.startsWith(country.code)
    ? digitsOnly(value.slice(country.code.length))
    : digitsOnly(value)
  ).slice(0, maxDigits);

  const formatted = formatDigits(rawDigits, country.groups);

  useEffect(() => {
    onComplete?.(rawDigits.length === maxDigits);
  }, [rawDigits.length, maxDigits, onComplete]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Desktop precise deletion: drop exactly one digit regardless of mask char.
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(country.code + rawDigits.slice(0, -1));
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const ie = e.nativeEvent as InputEvent;
    // Mobile virtual keyboards fire deleteContentBackward instead of a keydown
    // Backspace. rawDigits reflects the OLD value here, so slice(-1) removes
    // exactly one digit even when the browser deleted a mask char like ')'.
    if ((ie.inputType ?? "").startsWith("delete")) {
      onChange(country.code + rawDigits.slice(0, -1));
      return;
    }
    // Pure controlled: re-derive digits from the full input value. NO manual
    // DOM mutation — that desyncs React's value tracker and lets the field
    // accept unlimited unformatted input (the Android bug).
    const digits = digitsOnly(e.target.value).slice(0, maxDigits);
    onChange(country.code + digits);
  }

  function selectCountry(iso: string) {
    const c = COUNTRIES.find((x) => x.iso === iso) ?? COUNTRIES[0];
    setCountry(c);
    const newMax = c.groups.reduce((s, n) => s + n, 0);
    onChange(c.code + rawDigits.slice(0, newMax));
  }

  return (
    <div
      className="flex items-center bg-white/10 border border-white/20 rounded-2xl overflow-hidden
        focus-within:border-blue-500 focus-within:bg-white/15 transition-all"
    >
      {/* Country picker — native <select> overlay. Taps work on every mobile OS. */}
      <div className="relative flex items-center gap-1.5 pl-5 pr-3 py-3.5 shrink-0
                      border-r border-white/20">
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-white/80 text-sm font-semibold">{country.code}</span>
        <ChevronDown size={13} className="text-white/40" />
        <select
          aria-label="Код страны"
          value={country.iso}
          onChange={(e) => selectCountry(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={formatted}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={formatDigits("0".repeat(maxDigits), country.groups)}
        required={required}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 bg-transparent px-4 py-3.5
          text-white placeholder:text-white/25 text-base outline-none"
      />
    </div>
  );
}
