"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import PhoneInput from "./PhoneInput";
import PinInput, { PinInputHandle } from "./PinInput";
import SpinCoachLogo from "./SpinCoachLogo";

const INPUT = `w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20
  text-white placeholder:text-white/35 text-base outline-none
  focus:border-blue-500 focus:bg-white/15 transition-all`;

const BTN = `w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
  disabled:opacity-40 text-white font-bold text-base transition-all active:scale-[.98]`;

interface Props {
  onSuccess?: (user: User) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [phone, setPhone]       = useState("");
  const [name, setName]         = useState("");
  const [pin, setPin]           = useState("");
  const [confirmPin, setConfirm] = useState("");
  const pinRef                  = useRef<PinInputHandle>(null);

  const [error, setError]       = useState<string | null>(null);
  const [fieldError, setFE]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFE(null);
    if (step === 1) {
      if (!phone.trim()) { setFE("Введите номер телефона."); return; }
      setStep(2);
    } else if (step === 2) {
      if (name.trim().length < 2) { setFE("Имя должно содержать минимум 2 символа."); return; }
      setPin(""); setConfirm("");
      setStep(3);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFE(null);
    if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
    if (pin !== confirmPin) { setFE("PIN-коды не совпадают."); return; }
    setLoading(true);
    try {
      const user = await api.register({ phone, name: name.trim(), password: pin, confirm_password: confirmPin });
      onSuccess?.(user);
    } catch (err) {
      const e = err as ApiError;
      if (e.phone) { setFE(Array.isArray(e.phone) ? e.phone[0] : e.phone as string); setStep(1); }
      else if (e.name) { setFE(Array.isArray(e.name) ? e.name[0] : e.name as string); setStep(2); }
      else if (e.password) { setFE(Array.isArray(e.password) ? e.password[0] : e.password as string); }
      else { setError((e.detail as string) ?? "Ошибка регистрации."); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b35] flex flex-col px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        {step > 1 ? (
          <button
            onClick={() => { setError(null); setFE(null); setStep((s) => (s - 1) as 1 | 2 | 3); }}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <SpinCoachLogo size="sm" />
        )}
        <span className="text-white/35 text-xs">Шаг {step} / 3</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">

        {/* ── Step 1: Phone ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">Ваш номер телефона?</h1>
              <p className="text-white/55 mt-2 text-sm">Создайте аккаунт, чтобы участвовать в турнирах.</p>
            </div>
            <form onSubmit={goNext} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Номер телефона</label>
                <PhoneInput value={phone} onChange={setPhone} required autoFocus />
                {fieldError && <p className="text-red-300 text-xs">{fieldError}</p>}
              </div>
              <button type="submit" className={BTN}>Продолжить</button>
            </form>
            <p className="text-center text-sm text-white/40">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-blue-400 hover:underline font-medium">Войти</Link>
            </p>
          </>
        )}

        {/* ── Step 2: Name ──────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">Как вас зовут?</h1>
              <p className="text-white/55 mt-2 text-sm">Имя увидят другие участники.</p>
            </div>
            <form onSubmit={goNext} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Ваше имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Алан Смагулов"
                  required
                  autoFocus
                  className={INPUT}
                />
                {fieldError && <p className="text-red-300 text-xs">{fieldError}</p>}
              </div>
              <button type="submit" className={BTN}>Продолжить</button>
            </form>
          </>
        )}

        {/* ── Step 3: PIN + Confirm PIN ─────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">Придумайте PIN-код</h1>
              <p className="text-white/55 mt-2 text-sm">6 цифр — запомните его для входа.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">PIN-код</label>
                <PinInput ref={pinRef} value={pin} onChange={setPin} autoFocus />
              </div>

              {/* Confirm appears once PIN is filled */}
              {pin.length === 6 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Подтвердите PIN-код</label>
                  <PinInput
                    value={confirmPin}
                    onChange={setConfirm}
                    autoFocus
                    onBackspaceEmpty={() => pinRef.current?.focusLast()}
                  />
                </div>
              )}

              {(fieldError || error) && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                  <p className="text-red-200 text-sm">{fieldError ?? error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || pin.length < 6 || confirmPin.length < 6}
                className={BTN}
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
