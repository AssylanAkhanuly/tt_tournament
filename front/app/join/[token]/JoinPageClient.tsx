"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";
import PhoneInput from "@/components/PhoneInput";
import PinInput, { PinInputHandle } from "@/components/PinInput";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";

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
    <div className="min-h-screen bg-[#0d1b35] flex flex-col">
      <TournamentBadge tournament={tournament} />
      <div className="flex mx-5 mb-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5">
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

// ─── Register 3-step + auto-join ─────────────────────────────────────────────

function RegisterAndJoinSteps({ joinToken }: { joinToken: string }) {
  const router = useRouter();
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [phone, setPhone]         = useState("");
  const [name, setName]           = useState("");
  const [pin, setPin]             = useState("");
  const [confirmPin, setConfirm]  = useState("");
  const pinRef                    = useRef<PinInputHandle>(null);
  const [fieldError, setFE]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setFE(null); setError(null);
    if (step === 1) {
      if (!phone.trim()) { setFE("Введите номер телефона."); return; }
      setStep(2);
    } else if (step === 2) {
      if (name.trim().length < 2) { setFE("Имя должно содержать минимум 2 символа."); return; }
      setPin(""); setConfirm("");
      setStep(3);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setFE(null);
    if (pin.length < 6) { setFE("Введите 6-значный PIN-код."); return; }
    if (pin !== confirmPin) { setFE("PIN-коды не совпадают."); return; }
    setLoading(true);
    try {
      await api.registerAndJoin(joinToken, { phone, name: name.trim(), password: pin, confirm_password: confirmPin });
      router.push("/dashboard");
    } catch (err) {
      const e = err as Record<string, string | string[]>;
      if (e.phone) { setFE(Array.isArray(e.phone) ? e.phone[0] : e.phone as string); setStep(1); }
      else if (e.name) { setFE(Array.isArray(e.name) ? e.name[0] : e.name as string); setStep(2); }
      else { setError((e.detail as string) ?? "Ошибка регистрации."); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-5 space-y-7 max-w-sm mx-auto w-full">

      {/* ── Step 1: Phone ── */}
      {step === 1 && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">Ваш номер телефона?</h1>
            <p className="text-white/55 mt-1.5 text-sm">Введите данные, чтобы вступить в турнир.</p>
          </div>
          <form onSubmit={goNext} className="space-y-4">
            <Field label="Номер телефона" error={fieldError ?? undefined}>
              <PhoneInput value={phone} onChange={setPhone} required autoFocus />
            </Field>
            <button type="submit" className={BTN_PRIMARY}>Продолжить</button>
          </form>
        </>
      )}

      {/* ── Step 2: Name ── */}
      {step === 2 && (
        <>
          <div className="flex items-start gap-3">
            <button onClick={() => setStep(1)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Как вас зовут?</h1>
              <p className="text-white/55 mt-1 text-sm">Имя увидят другие участники.</p>
            </div>
          </div>
          <form onSubmit={goNext} className="space-y-4">
            <Field label="Ваше имя" error={fieldError ?? undefined}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Алан Смагулов" required autoFocus className={INPUT} />
            </Field>
            <button type="submit" className={BTN_PRIMARY}>Продолжить</button>
          </form>
        </>
      )}

      {/* ── Step 3: PIN + Confirm PIN ── */}
      {step === 3 && (
        <>
          <div className="flex items-start gap-3">
            <button onClick={() => setStep(2)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Придумайте PIN-код</h1>
              <p className="text-white/55 mt-1 text-sm">6 цифр для входа в аккаунт.</p>
            </div>
          </div>
          <form onSubmit={handleFinish} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">PIN-код</label>
              <PinInput ref={pinRef} value={pin} onChange={setPin} autoFocus />
            </div>
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
            {(fieldError || error) && <ErrorBox msg={fieldError ?? error!} />}
            <button type="submit" disabled={loading || pin.length < 6 || confirmPin.length < 6} className={BTN_PRIMARY}>
              {loading ? "Вступаем в турнир..." : "Зарегистрироваться и вступить"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// ─── Login + auto-join (2-step) ───────────────────────────────────────────────

function LoginAndJoinForm({ joinToken }: { joinToken: string }) {
  const router = useRouter();
  const [step, setStep]       = useState<1 | 2>(1);
  const [phone, setPhone]     = useState("");
  const [pin, setPin]         = useState("");
  const [fieldError, setFE]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    setFE(null);
    if (!phone.trim()) { setFE("Введите номер телефона."); return; }
    setPin("");
    setStep(2);
  }

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

  return (
    <div className="px-5 py-5 space-y-7 max-w-sm mx-auto w-full">

      {/* ── Step 1: Phone ── */}
      {step === 1 && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">Войдите в аккаунт</h1>
            <p className="text-white/55 mt-1.5 text-sm">После входа вы автоматически вступите в турнир.</p>
          </div>
          <form onSubmit={goStep2} className="space-y-4">
            <Field label="Номер телефона" error={fieldError ?? undefined}>
              <PhoneInput value={phone} onChange={setPhone} required autoFocus />
            </Field>
            <button type="submit" className={BTN_PRIMARY}>Продолжить</button>
          </form>
        </>
      )}

      {/* ── Step 2: PIN ── */}
      {step === 2 && (
        <>
          <div className="flex items-start gap-3">
            <button onClick={() => setStep(1)} className="text-white/60 hover:text-white mt-1"><ArrowLeft size={20} /></button>
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
    <div className="mx-5 mt-10 mb-4 bg-white/10 border border-white/15 rounded-2xl p-4">
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
    <div className="min-h-screen bg-[#0d1b35] flex flex-col px-5 py-10">
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
