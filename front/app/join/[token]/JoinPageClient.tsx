"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";
import PhoneInput from "@/components/PhoneInput";
import PinInput, { PinInputHandle } from "@/components/PinInput";
import { ArrowLeft } from "lucide-react";

const INPUT = `w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20
  text-white placeholder:text-white/35 text-base outline-none
  focus:border-blue-500 focus:bg-white/15 transition-all`;

const BTN_PRIMARY = `w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700
  disabled:opacity-40 text-white font-bold text-base transition-all active:scale-[.98]`;

interface Props {
  tournament: Tournament;
  joinToken: string;
  user: User | null;
  alreadyJoined: boolean;
}

export default function JoinPageClient({ tournament, joinToken, user, alreadyJoined }: Props) {
  const router = useRouter();

  if (user && alreadyJoined) {
    return (
      <DarkShell tournament={tournament}>
        <div className="text-center space-y-5 py-6">
          <div className="text-6xl">✅</div>
          <h2 className="text-xl font-bold text-white">Вы уже участник!</h2>
          <p className="text-white/60 text-sm">Вы уже зарегистрированы в этом турнире.</p>
          <button onClick={() => router.push("/dashboard")} className={BTN_PRIMARY}>Перейти в кабинет</button>
        </div>
      </DarkShell>
    );
  }

  if (user && !alreadyJoined) {
    return (
      <DarkShell tournament={tournament}>
        <JoinConfirmSection tournament={tournament} joinToken={joinToken} />
      </DarkShell>
    );
  }

  return <UnauthFlow tournament={tournament} joinToken={joinToken} />;
}

// ─── Unauthenticated: tabs ────────────────────────────────────────────────────

function UnauthFlow({ tournament, joinToken }: { tournament: Tournament; joinToken: string }) {
  const [tab, setTab] = useState<"register" | "login">("register");

  return (
    <div className="h-[100dvh] bg-[#0d1b35] flex flex-col overflow-hidden">
      <TournamentBadge tournament={tournament} />
      <div className="flex mx-5 mb-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 shrink-0">
        <TabBtn label="Регистрация" active={tab === "register"} onClick={() => setTab("register")} />
        <TabBtn label="Уже есть аккаунт" active={tab === "login"} onClick={() => setTab("login")} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "register"
          ? <RegisterAndJoinSteps joinToken={joinToken} />
          : <LoginAndJoinForm joinToken={joinToken} />
        }
      </div>
    </div>
  );
}

// ─── Register 4-step + auto-join ─────────────────────────────────────────────

type JStep = 1 | 2 | 3 | 4;

function RegisterAndJoinSteps({ joinToken }: { joinToken: string }) {
  const router = useRouter();
  const [step, setStep]          = useState<JStep>(1);
  const [dir, setDir]            = useState<"forward" | "back">("forward");
  const [phone, setPhone]        = useState("");
  const [phoneComplete, setPhoneComplete] = useState(false);
  const [name, setName]          = useState("");
  const [pin, setPin]            = useState("");
  const [confirmPin, setConfirm] = useState("");
  const pinRef                   = useRef<PinInputHandle>(null);
  const [fieldError, setFE]      = useState<string | null>(null);
  const [error, setError]        = useState<string | null>(null);
  const [loading, setLoading]    = useState(false);

  function go(target: JStep) {
    setDir(target > step ? "forward" : "back");
    setFE(null); setError(null);
    setStep(target);
  }

  // Browser back interception
  useEffect(() => {
    if (step > 1) window.history.pushState({ joinRegStep: step }, "");
  }, [step]);

  useEffect(() => {
    function onPop() {
      setStep((s) => {
        if (s > 1) { setDir("back"); setError(null); setFE(null); return (s - 1) as JStep; }
        return s;
      });
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (step === 4 && confirmPin.length === 6 && pin === confirmPin && !loading) {
      doRegister();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin]);

  async function doRegister() {
    setFE(null); setError(null);
    setLoading(true);
    try {
      await api.registerAndJoin(joinToken, { phone, name: name.trim(), password: pin, confirm_password: pin });
      router.push("/dashboard");
    } catch (err) {
      const e = err as Record<string, string | string[]>;
      if (e.phone)     { setFE(Array.isArray(e.phone) ? e.phone[0] : e.phone as string); go(1); }
      else if (e.name) { setFE(Array.isArray(e.name)  ? e.name[0]  : e.name  as string); go(2); }
      else { setError((e.detail as string) ?? "Ошибка регистрации."); }
    } finally {
      setLoading(false);
    }
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setFE(null); setError(null);
    if (step === 1) {
      if (!phoneComplete) { setFE("Введите полный номер телефона."); return; }
      go(2);
    } else if (step === 2) {
      if (name.trim().length < 2) { setFE("Имя должно содержать минимум 2 символа."); return; }
      setPin(""); go(3);
    } else if (step === 3) {
      if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
      setConfirm(""); go(4);
    } else if (step === 4) {
      if (pin !== confirmPin) { setFE("PIN-коды не совпадают."); return; }
      doRegister();
    }
  }

  const animClass = dir === "forward" ? "step-forward" : "step-back";

  return (
    <div className="px-5 py-5 max-w-sm mx-auto w-full">
      <div key={step} className={`space-y-6 ${animClass}`}>

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Ваш номер телефона?</h1>
              <p className="text-white/55 mt-1.5 text-sm">Введите данные, чтобы вступить в турнир.</p>
            </div>
            <form onSubmit={handleNext} className="space-y-4">
              <Field label="Номер телефона" error={fieldError ?? undefined}>
                <PhoneInput value={phone} onChange={setPhone} onComplete={setPhoneComplete} required autoFocus />
              </Field>
              <button type="submit" disabled={!phoneComplete} className={BTN_PRIMARY}>Продолжить</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-start gap-3">
              <button onClick={() => go(1)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Как вас зовут?</h1>
                <p className="text-white/55 mt-1 text-sm">Имя увидят другие участники.</p>
              </div>
            </div>
            <form onSubmit={handleNext} className="space-y-4">
              <Field label="Ваше имя" error={fieldError ?? undefined}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Алан Смагулов" required autoFocus className={INPUT} />
              </Field>
              <button type="submit" className={BTN_PRIMARY}>Продолжить</button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-start gap-3">
              <button onClick={() => go(2)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Придумайте PIN-код</h1>
                <p className="text-white/55 mt-1 text-sm">6 цифр для входа в аккаунт.</p>
              </div>
            </div>
            <form onSubmit={handleNext} className="space-y-6">
              <PinInput ref={pinRef} value={pin} onChange={setPin} autoFocus />
              {fieldError && <ErrorBox msg={fieldError} />}
              <button type="submit" disabled={pin.length < 6} className={BTN_PRIMARY}>Продолжить</button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex items-start gap-3">
              <button onClick={() => go(3)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Подтвердите PIN-код</h1>
                <p className="text-white/55 mt-1 text-sm">Введите PIN-код ещё раз.</p>
              </div>
            </div>
            <form onSubmit={handleNext} className="space-y-6">
              <PinInput
                value={confirmPin}
                onChange={(v) => { setFE(null); setConfirm(v); }}
                autoFocus
                onBackspaceEmpty={() => go(3)}
              />
              {(fieldError || error) && <ErrorBox msg={fieldError ?? error!} />}
              {loading && <p className="text-center text-white/50 text-sm">Вступаем в турнир...</p>}
            </form>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Login + auto-join (2-step) ───────────────────────────────────────────────

function LoginAndJoinForm({ joinToken }: { joinToken: string }) {
  const router = useRouter();
  const [step, setStep]       = useState<1 | 2>(1);
  const [dir, setDir]         = useState<"forward" | "back">("forward");
  const [phone, setPhone]     = useState("");
  const [phoneComplete, setPhoneComplete] = useState(false);
  const [pin, setPin]         = useState("");
  const [fieldError, setFE]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function go(target: 1 | 2) {
    setDir(target > step ? "forward" : "back");
    setFE(null); setError(null);
    setStep(target);
  }

  // Browser back interception
  useEffect(() => {
    if (step > 1) window.history.pushState({ joinLoginStep: step }, "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
    setError(null); setFE(null);
    setLoading(true);
    try {
      await api.login(phone, pin);
      try { await api.joinByToken(joinToken); } catch { /* already joined */ }
      router.push("/dashboard");
    } catch (err) {
      const e = err as Record<string, string>;
      setError(e?.detail ?? "Неверный номер или PIN-код.");
    } finally {
      setLoading(false);
    }
  }

  const animClass = dir === "forward" ? "step-forward" : "step-back";

  return (
    <div className="px-5 py-5 max-w-sm mx-auto w-full">
      <div key={step} className={`space-y-6 ${animClass}`}>

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Войдите в аккаунт</h1>
              <p className="text-white/55 mt-1.5 text-sm">После входа вы автоматически вступите в турнир.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!phoneComplete) { setFE("Введите полный номер телефона."); return; } setPin(""); go(2); }} className="space-y-4">
              <Field label="Номер телефона" error={fieldError ?? undefined}>
                <PhoneInput value={phone} onChange={setPhone} onComplete={setPhoneComplete} required autoFocus />
              </Field>
              <button type="submit" disabled={!phoneComplete} className={BTN_PRIMARY}>Продолжить</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-start gap-3">
              <button onClick={() => go(1)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Введите PIN-код</h1>
                <p className="text-white/55 mt-1 text-sm">6-значный PIN-код вашего аккаунта.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <PinInput value={pin} onChange={setPin} autoFocus />
              {(fieldError || error) && <ErrorBox msg={fieldError ?? error!} />}
              <button type="submit" disabled={loading || pin.length < 6} className={BTN_PRIMARY}>
                {loading ? "Вход..." : "Войти и вступить"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Confirm join ─────────────────────────────────────────────────────────────

function JoinConfirmSection({ tournament, joinToken }: { tournament: Tournament; joinToken: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true); setError(null);
    try {
      await api.joinByToken(joinToken);
      router.push("/dashboard");
    } catch (err) {
      const e = err as Record<string, string>;
      setError(e?.detail ?? "Не удалось вступить.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center space-y-5 py-4">
      <div className="text-5xl">🏓</div>
      <h2 className="text-xl font-bold text-white">Вступить в турнир?</h2>
      <p className="text-white/60 text-sm">Вы войдёте как участник «{tournament.name}».</p>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button onClick={handleJoin} disabled={loading} className={BTN_PRIMARY}>
        {loading ? "Вступаем..." : "Вступить"}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-red-300 text-xs">{error}</p>}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
      <p className="text-red-200 text-sm">{msg}</p>
    </div>
  );
}

function TournamentBadge({ tournament }: { tournament: Tournament }) {
  return (
    <div className="mx-5 mt-10 mb-4 bg-white/10 border border-white/15 rounded-2xl p-4 shrink-0">
      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-0.5">Приглашение</p>
      <h2 className="text-white font-bold text-lg leading-snug">{tournament.name}</h2>
      {tournament.description && (
        <p className="text-white/50 text-sm mt-0.5 line-clamp-1">{tournament.description}</p>
      )}
      <p className="text-white/40 text-xs mt-1">👥 {tournament.participant_count} участников</p>
    </div>
  );
}

function DarkShell({ tournament, children }: { tournament: Tournament; children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] bg-[#0d1b35] flex flex-col px-5 py-10 overflow-hidden">
      <TournamentBadge tournament={tournament} />
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {children}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
        active ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
      }`}>
      {label}
    </button>
  );
}
