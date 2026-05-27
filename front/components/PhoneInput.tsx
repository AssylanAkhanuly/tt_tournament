"use client";

import { ChevronDown } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}

/**
 * Integrated phone input:
 * [ 🇰🇿 +7  ▾ | (700) 000-00-00         ]
 */
export default function PhoneInput({ value, onChange, required, autoFocus }: Props) {
  return (
    <div className="flex items-center bg-white/10 border border-white/20 rounded-2xl overflow-hidden
      focus-within:border-blue-500 focus-within:bg-white/15 transition-all">

      {/* Country-code badge */}
      <div className="flex items-center gap-1.5 pl-4 pr-3 py-3.5 shrink-0 border-r border-white/20">
        <span className="text-base leading-none">🇰🇿</span>
        <span className="text-white/80 text-sm font-semibold">+7</span>
        <ChevronDown size={13} className="text-white/40 ml-0.5" />
      </div>

      {/* Number field */}
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(700) 000-00-00"
        required={required}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent px-4 py-3.5
          text-white placeholder:text-white/35 text-base outline-none"
      />
    </div>
  );
}
