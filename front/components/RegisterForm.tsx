"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import PinInput from "./PinInput";

interface Props {
  onSuccess?: (user: User) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setPin("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 6) { setError("Введите 6-значный PIN-код."); return; }
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await api.register({ phone, name, password: pin, confirm_password: pin });
      onSuccess?.(user);
    } catch (err) {
      const e = err as ApiError;
      if (e.phone || e.name) {
        setFieldErrors({
          phone: Array.isArray(e.phone) ? e.phone[0] : (e.phone as string) ?? "",
          name: Array.isArray(e.name) ? e.name[0] : (e.name as string) ?? "",
        });
        setStep(1);
      } else if (e.password) {
        setError(Array.isArray(e.password) ? e.password[0] : e.password as string);
      } else {
        setError((e.detail as string) ?? "Ошибка регистрации.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#163535] flex flex-col px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        {step === 2 ? (
          <button onClick={() => setStep(1)} className="text-white/60 hover:text-white text-2xl leading-none">
            ←
          </button>
        ) : (
          <div className="text-white/50 text-sm font-medium">🏓 ТТ Платформа</div>
        )}
        <span className="text-white/35 text-xs">Шаг {step} / 2</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">

        {/* ── Step 1: Name + Phone ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Ваш номер<br />телефона?
              </h1>
              <p className="text-white/55 mt-2 text-sm">
                Введите имя и номер, чтобы создать аккаунт.
              </p>
            </div>

            <form onSubmit={goToStep2} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Ваше имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Алан Смагулов"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20
                    text-white placeholder:text-white/35 text-base outline-none
                    focus:border-blue-500 focus:bg-white/15 transition-all"
                />
                {fieldErrors.name && <p className="text-red-300 text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 700 000 00 00"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20
                    text-white placeholder:text-white/35 text-base outline-none
                    focus:border-blue-500 focus:bg-white/15 transition-all"
                />
                {fieldErrors.phone && <p className="text-red-300 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              <p className="text-white/35 text-xs leading-relaxed">
                Нажимая «Продолжить» вы соглашаетесь с условиями использования платформы.
              </p>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
                  text-white font-bold text-base transition-all active:scale-[.98]"
              >
                Продолжить
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: PIN ──────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Добро<br />пожаловать!
              </h1>
              <p className="text-white/55 mt-2 text-sm">
                Придумайте 6-значный PIN-код для входа.
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
                {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
