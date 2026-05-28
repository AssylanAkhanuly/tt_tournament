"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import PhoneInput from "./PhoneInput";
import PinInput from "./PinInput";
import SpinCoachLogo from "./SpinCoachLogo";

const BTN = `w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
  disabled:opacity-40 text-white font-bold text-base transition-all active:scale-[.98]`;

interface Props {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [phone, setPhone]         = useState("");
  const [phoneComplete, setPhoneComplete] = useState(false);
  const [pin, setPin]             = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [fieldError, setFE]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [dir, setDir]             = useState<"forward" | "back">("forward");

  // Browser back interception
  useEffect(() => {
    if (step > 1) window.history.pushState({ loginStep: step }, "");
  }, [step]);

  useEffect(() => {
    function onPop() {
      setStep((s) => {
        if (s > 1) { setDir("back"); setError(null); setFE(null); return 1; }
        return s;
      });
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function go(target: 1 | 2) {
    setDir(target > step ? "forward" : "back");
    setError(null); setFE(null);
    setStep(target);
  }

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFE(null);
    if (!phoneComplete) { setFE("Введите полный номер телефона."); return; }
    setPin("");
    go(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
    setError(null); setFE(null);
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
    <div className="h-[100dvh] flex flex-col px-6 py-10 overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        {step === 2 ? (
          <button onClick={() => go(1)}
            className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <SpinCoachLogo size="sm" />
        )}
        <span className="text-white/35 text-xs">Шаг {step} / 2</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div key={step} className={`space-y-8 ${dir === "forward" ? "step-forward" : "step-back"}`}>

        {/* ── Step 1: Phone ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">С возвращением!</h1>
              <p className="text-white/55 mt-2 text-sm">Введите номер телефона для входа.</p>
            </div>
            <form onSubmit={goStep2} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Номер телефона</label>
                <PhoneInput value={phone} onChange={setPhone} onComplete={setPhoneComplete} required autoFocus />
                {fieldError && <p className="text-red-300 text-xs">{fieldError}</p>}
              </div>
              <button type="submit" disabled={!phoneComplete} className={BTN}>Продолжить</button>
            </form>
            <p className="text-center text-sm text-white/40">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-blue-400 hover:underline font-medium">Зарегистрироваться</Link>
            </p>
          </>
        )}

        {/* ── Step 2: PIN ───────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">Введите PIN-код</h1>
              <p className="text-white/55 mt-2 text-sm">6-значный PIN-код вашего аккаунта.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <PinInput value={pin} onChange={setPin} autoFocus />
              {(fieldError || error) && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                  <p className="text-red-200 text-sm">{fieldError ?? error}</p>
                </div>
              )}
              <button type="submit" disabled={loading || pin.length < 6} className={BTN}>
                {loading ? "Вход..." : "Войти"}
              </button>
            </form>
          </>
        )}

        </div>
      </div>
    </div>
  );
}
