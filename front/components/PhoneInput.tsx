"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  usePhoneInput,
  defaultCountries,
  parseCountry,
  getActiveFormattingMask,
  FlagImage,
} from "react-international-phone";

// Limit the picker to the CIS countries the clubs operate in (matches prior UX).
const CIS_ISO = ["kz", "ru", "kg", "uz", "tj", "tm", "az", "am", "ge", "ua", "by"];
const COUNTRIES = defaultCountries.filter((c) => CIS_ISO.includes(parseCountry(c).iso2));

interface Props {
  value: string;
  onChange: (val: string) => void;
  /** Called with true when the number matches the country's full mask length */
  onComplete?: (complete: boolean) => void;
  required?: boolean;
  autoFocus?: boolean;
}

export default function PhoneInput({ value, onChange, onComplete, required, autoFocus }: Props) {
  // Headless hook from react-international-phone: it owns formatting, cursor
  // management and mobile-keyboard quirks, while we keep our own markup/styles.
  const { inputValue, phone, country, setCountry, handlePhoneValueChange, inputRef } =
    usePhoneInput({
      defaultCountry: "kz",
      value,
      countries: COUNTRIES,
      onChange: (data) => onChange(data.phone), // data.phone is E.164 (+77071234567)
    });

  // Completeness: national digit count reaches the active mask's length.
  useEffect(() => {
    const mask = getActiveFormattingMask({ phone, country });
    const maskLen = (mask.match(/\./g) || []).length;
    const national = phone.replace(/\D/g, "").slice(country.dialCode.length);
    onComplete?.(maskLen > 0 && national.length >= maskLen);
  }, [phone, country, onComplete]);

  return (
    <div
      className="flex items-center bg-white/10 border border-white/20 rounded-2xl overflow-hidden
        focus-within:border-blue-500 focus-within:bg-white/15 transition-all"
    >
      {/* Country picker — native <select> overlay so taps work on every mobile OS,
          driven by the hook's setCountry. */}
      <div className="relative flex items-center gap-1.5 pl-5 pr-3 py-3.5 shrink-0
                      border-r border-white/20">
        <FlagImage iso2={country.iso2} style={{ width: 20, height: 20 }} />
        <span className="text-white/80 text-sm font-semibold">+{country.dialCode}</span>
        <ChevronDown size={13} className="text-white/40" />
        <select
          aria-label="Код страны"
          value={country.iso2}
          onChange={(e) => setCountry(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
        >
          {COUNTRIES.map((c) => {
            const p = parseCountry(c);
            return (
              <option key={p.iso2} value={p.iso2}>
                {p.name} (+{p.dialCode})
              </option>
            );
          })}
        </select>
      </div>

      <input
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={inputValue}
        onChange={handlePhoneValueChange}
        placeholder="+7 (707) 123-45-67"
        required={required}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 bg-transparent px-4 py-3.5
          text-white placeholder:text-white/25 text-base outline-none"
      />
    </div>
  );
}
