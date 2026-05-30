"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import PhoneInput from "./PhoneInput";
import PinInput from "./PinInput";
import SpinCoachLogo from "./SpinCoachLogo";
import LanguageSwitcher from "./LanguageSwitcher";

const BTN = `w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
  disabled:opacity-40 text-white font-bold text-base transition-all active:scale-[.98]`;

interface Props {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const { t } = useLang();
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
    if (!phoneComplete) { setFE(t.full_phone_required); return; }
    setPin("");
    go(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 6) { setFE(t.pin_6_required); return; }
    setError(null); setFE(null);
    setLoading(true);
    try {
      const user = await api.login(phone, pin);
      onSuccess?.(user);
    } catch (err) {
      const e = err as ApiError;
      setError((e.detail as string) ?? t.wrong_credentials);
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
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="select" />
          <span className="text-white/35 text-xs">{t.step} {step} {t.step_of} 2</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div key={step} className={`space-y-8 ${dir === "forward" ? "step-forward" : "step-back"}`}>

        {/* ── Step 1: Phone ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">{t.welcome_back}</h1>
              <p className="text-white/55 mt-2 text-sm">{t.enter_phone_hint}</p>
            </div>
            <form onSubmit={goStep2} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">{t.phone_number}</label>
                <PhoneInput value={phone} onChange={setPhone} onComplete={setPhoneComplete} required autoFocus />
                {fieldError && <p className="text-red-300 text-xs">{fieldError}</p>}
              </div>
              <button type="submit" disabled={!phoneComplete} className={BTN}>{t.continue}</button>
            </form>
            <p className="text-center text-sm text-white/40">
              {t.no_account}{" "}
              <Link href="/register" className="text-blue-400 hover:underline font-medium">{t.register_link}</Link>
            </p>
          </>
        )}

        {/* ── Step 2: PIN ───────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">{t.enter_pin_title}</h1>
              <p className="text-white/55 mt-2 text-sm">{t.pin_subtitle}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <PinInput value={pin} onChange={setPin} autoFocus />
              {(fieldError || error) && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                  <p className="text-red-200 text-sm">{fieldError ?? error}</p>
                </div>
              )}
              <button type="submit" disabled={loading || pin.length < 6} className={BTN}>
                {loading ? t.logging_in : t.login_btn}
              </button>
            </form>
          </>
        )}

        </div>
      </div>
    </div>
  );
}
