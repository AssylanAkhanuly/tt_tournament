"use client";

import { useRef, ClipboardEvent, KeyboardEvent } from "react";

interface Props {
  value: string;          // 0–6 digit string (no spaces)
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * 6-box PIN / passcode input.
 * - Digits only (blocks non-numeric)
 * - Auto-advance on digit entry
 * - Backspace clears current box then moves left
 * - Paste auto-fills all boxes
 */
export default function PinInput({ value, onChange, disabled, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleInput(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    // Replace the character at idx
    const chars = (value + "").split("");
    chars[idx] = digit;
    // Keep only up to idx+1 chars if the string was shorter
    const newVal = chars.slice(0, Math.max(value.length, idx + 1)).join("");
    onChange(newVal.slice(0, 6));

    if (idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[idx]) {
        // Clear this position
        onChange(value.slice(0, idx) + value.slice(idx + 1));
      } else if (idx > 0) {
        // Move to previous and clear it
        refs.current[idx - 1]?.focus();
        onChange(value.slice(0, idx - 1) + value.slice(idx));
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ""}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          className={`
            w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none
            transition-all duration-150 select-none
            ${disabled ? "opacity-50 cursor-not-allowed bg-white/80" : "bg-white cursor-text"}
            ${value[i]
              ? "border-blue-500 text-gray-900 shadow-md"
              : "border-white/30 text-gray-900 shadow-sm"
            }
            focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.25)]
          `}
        />
      ))}
    </div>
  );
}
