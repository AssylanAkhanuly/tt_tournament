"use client";

import { useState, useRef, useEffect } from "react";
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

type Step = 1 | 2 | 3 | 4;

interface Props {
  onSuccess?: (user: User) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [step, setStep]           = useState<Step>(1);
  const [dir, setDir]             = useState<"forward" | "back">("forward");

  const [phone, setPhone]         = useState("");
  const [phoneComplete, setPhoneComplete] = useState(false);
  const [name, setName]           = useState("");
  const [pin, setPin]             = useState("");
  const [confirmPin, setConfirm]  = useState("");
  const pinRef                    = useRef<PinInputHandle>(null);

  const [error, setError]         = useState<string | null>(null);
  const [fieldError, setFE]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  // ── Browser back interception ──────────────────────────────────────────────
  useEffect(() => {
    // Push a history entry every time we advance past step 1
    if (step > 1) {
      window.history.pushState({ registerStep: step }, "");
    }
  }, [step]);

  useEffect(() => {
    function onPop() {
      setStep((s) => {
        if (s > 1) {
          setDir("back");
          setError(null); setFE(null);
          return (s - 1) as Step;
        }
        return s;
      });
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Auto-submit when confirm PIN matches ───────────────────────────────────
  useEffect(() => {
    if (step === 4 && confirmPin.length === 6 && pin === confirmPin && !loading) {
      submit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin]);

  async function submit() {
    setError(null); setFE(null);
    setLoading(true);
    try {
      const user = await api.register({ phone, name: name.trim(), password: pin, confirm_password: pin });
      onSuccess?.(user);
    } catch (err) {
      const e = err as ApiError;
      if (e.phone)         { setFE(Array.isArray(e.phone)    ? e.phone[0]    : e.phone as string);    go(1); }
      else if (e.name)     { setFE(Array.isArray(e.name)     ? e.name[0]     : e.name as string);     go(2); }
      else if (e.password) { setFE(Array.isArray(e.password) ? e.password[0] : e.password as string); go(3); }
      else { setError((e.detail as string) ?? "Ошибка регистрации."); }
    } finally {
      setLoading(false);
    }
  }

  function go(target: Step) {
    setDir(target > step ? "forward" : "back");
    setError(null); setFE(null);
    setStep(target);
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFE(null);
    if (step === 1) {
      if (!phoneComplete) { setFE("Введите полный номер телефона."); return; }
      go(2);
    } else if (step === 2) {
      if (name.trim().length < 2) { setFE("Имя должно содержать минимум 2 символа."); return; }
      setPin("");
      go(3);
    } else if (step === 3) {
      if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
      setConfirm("");
      go(4);
    } else if (step === 4) {
      if (pin !== confirmPin) { setFE("PIN-коды не совпадают."); return; }
      submit();
    }
  }

  const animClass = dir === "forward" ? "step-forward" : "step-back";

  return (
    <div className="h-[100dvh] bg-[#0d1b35] flex flex-col px-6 py-10 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0 mb-auto">
        {step > 1 ? (
          <button onClick={() => go((step - 1) as Step)} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <SpinCoachLogo size="sm" />
        )}
        <span className="text-white/35 text-xs">Шаг {step} / 4</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div key={step} className={`space-y-8 ${animClass}`}>

          {/* ── Step 1: Phone ─────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">Ваш номер телефона?</h1>
                <p className="text-white/55 mt-2 text-sm">Создайте аккаунт, чтобы участвовать в турнирах.</p>
              </div>
              <form onSubmit={handleNext} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Номер телефона</label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    onComplete={setPhoneComplete}
                    required
                    autoFocus
                  />
                  {fieldError && <p className="text-red-300 text-xs">{fieldError}</p>}
                </div>
                <button type="submit" disabled={!phoneComplete} className={BTN}>Продолжить</button>
              </form>
              <p className="text-center text-sm text-white/40">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-blue-400 hover:underline font-medium">Войти</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Name ──────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">Как вас зовут?</h1>
                <p className="text-white/55 mt-2 text-sm">Имя увидят другие участники.</p>
              </div>
              <form onSubmit={handleNext} className="space-y-4">
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

          {/* ── Step 3: Create PIN ────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">Придумайте PIN-код</h1>
                <p className="text-white/55 mt-2 text-sm">6 цифр — запомните для входа.</p>
              </div>
              <form onSubmit={handleNext} className="space-y-8">
                <PinInput ref={pinRef} value={pin} onChange={setPin} autoFocus />
                {fieldError && (
                  <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                    <p className="text-red-200 text-sm">{fieldError}</p>
                  </div>
                )}
                <button type="submit" disabled={pin.length < 6} className={BTN}>Продолжить</button>
              </form>
            </>
          )}

          {/* ── Step 4: Confirm PIN ───────────────────────────────────── */}
          {step === 4 && (
            <>
              <div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">Подтвердите PIN-код</h1>
                <p className="text-white/55 mt-2 text-sm">Введите PIN-код ещё раз.</p>
              </div>
              <form onSubmit={handleNext} className="space-y-8">
                <PinInput
                  value={confirmPin}
                  onChange={(v) => { setFE(null); setConfirm(v); }}
                  autoFocus
                  onBackspaceEmpty={() => go(3)}
                />
                {(fieldError || error) && (
                  <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                    <p className="text-red-200 text-sm">{fieldError ?? error}</p>
                  </div>
                )}
                {loading && <p className="text-center text-white/50 text-sm">Создание аккаунта...</p>}
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
