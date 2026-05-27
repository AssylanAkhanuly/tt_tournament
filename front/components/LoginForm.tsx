"use client";

import { useState } from "react";
import Link from "next/link";
import SpinCoachLogo from "./SpinCoachLogo";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import { loginSchema } from "@/lib/validation";
import PinInput from "./PinInput";
import PhoneInput from "./PhoneInput";

interface Props {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate phone with Zod
    const result = loginSchema.pick({ phone: true }).safeParse({ phone });
    if (!result.success) {
      setFieldErrors({ phone: result.error.errors[0]?.message ?? "Неверный номер" });
      return;
    }

    setPin("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 6) { setError("Введите 6-значный PIN-код."); return; }
    setError(null);
    setLoading(true);
    try {
      const user = await api.login(phone, pin);
      onSuccess?.(user);
    } catch (err) {
      const e = err as ApiError;
      setError((e.detail as string) ?? "Неверный номер или PIN-код.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b35] flex flex-col px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        {step === 2 ? (
          <button onClick={() => setStep(1)} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <SpinCoachLogo size="sm" />
        )}
        <span className="text-white/35 text-xs">Шаг {step} / 2</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">

        {/* ── Step 1: Phone ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                С возвра­<br />щением!
              </h1>
              <p className="text-white/55 mt-2 text-sm">
                Введите номер телефона для входа.
              </p>
            </div>

            <form onSubmit={goToStep2} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Номер телефона
                </label>
                <PhoneInput value={phone} onChange={setPhone} required autoFocus />
                {fieldErrors.phone && <p className="text-red-300 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
                  text-white font-bold text-base transition-all active:scale-[.98]"
              >
                Продолжить
              </button>
            </form>

            <p className="text-center text-sm text-white/40">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-blue-400 hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: PIN ───────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Введите<br />PIN-код
              </h1>
              <p className="text-white/55 mt-2 text-sm">
                6-значный PIN-код для вашего аккаунта.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <PinInput value={pin} onChange={setPin} autoFocus />

              {error && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || pin.length < 6}
                className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
                  disabled:opacity-40 text-white font-bold text-base
                  transition-all active:scale-[.98]"
              >
                {loading ? "Вход..." : "Войти"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
