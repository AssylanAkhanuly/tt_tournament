"use client";

import { useRef, forwardRef, useImperativeHandle, ClipboardEvent, KeyboardEvent } from "react";

export interface PinInputHandle {
  /** Focus the last filled digit (or box 0 if empty) */
  focusLast: () => void;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Called when Backspace is pressed on box 0 and it is already empty */
  onBackspaceEmpty?: () => void;
}

const PinInput = forwardRef<PinInputHandle, Props>(
  ({ value, onChange, disabled, autoFocus, onBackspaceEmpty }, ref) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focusLast() {
        const idx = Math.max(0, Math.min(value.length, 5));
        inputs.current[idx]?.focus();
      },
    }));

    function handleInput(idx: number, raw: string) {
      const digit = raw.replace(/\D/g, "").slice(-1);
      if (!digit) return;
      const chars = value.split("");
      chars[idx] = digit;
      const newVal = chars.slice(0, Math.max(value.length, idx + 1)).join("");
      onChange(newVal.slice(0, 6));
      if (idx < 5) inputs.current[idx + 1]?.focus();
    }

    function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (value[idx]) {
          onChange(value.slice(0, idx) + value.slice(idx + 1));
        } else if (idx > 0) {
          inputs.current[idx - 1]?.focus();
          onChange(value.slice(0, idx - 1) + value.slice(idx));
        } else {
          // box 0 is already empty — bubble up to parent
          onBackspaceEmpty?.();
        }
      } else if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        inputs.current[idx - 1]?.focus();
      } else if (e.key === "ArrowRight" && idx < 5) {
        e.preventDefault();
        inputs.current[idx + 1]?.focus();
      }
    }

    function handlePaste(e: ClipboardEvent) {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }

    return (
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
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
              w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none caret-transparent
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
);
PinInput.displayName = "PinInput";
export default PinInput;
