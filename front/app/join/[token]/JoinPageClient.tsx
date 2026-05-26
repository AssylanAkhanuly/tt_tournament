"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import JoinConfirmation from "@/components/JoinConfirmation";

interface Props {
  tournament: Tournament;
  joinToken: string;
  user: User | null;
  alreadyJoined: boolean;
}

export default function JoinPageClient({ tournament, joinToken, user, alreadyJoined }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("register");

  // ─── State A: already joined ───────────────────────────────────────────────
  if (user && alreadyJoined) {
    return (
      <PageShell tournament={tournament}>
        <div className="text-center space-y-4 py-6">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-gray-900">Вы уже участник!</h2>
          <p className="text-gray-500">Вы уже зарегистрированы в турнире «{tournament.name}».</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Перейти в кабинет
          </button>
        </div>
      </PageShell>
    );
  }

  // ─── State B: logged in, not yet joined ────────────────────────────────────
  if (user && !alreadyJoined) {
    return (
      <PageShell tournament={tournament}>
        <JoinConfirmation tournament={tournament} joinToken={joinToken} />
      </PageShell>
    );
  }

  // ─── State C: not authenticated ────────────────────────────────────────────
  async function handleLoginSuccess(_u: User) {
    // After login, join the tournament immediately
    try {
      await api.joinByToken(joinToken);
    } catch {
      // Might already be joined — ignore
    }
    router.push("/dashboard");
  }

  async function handleRegisterSuccess(_u: User) {
    // registerAndJoin was called inside RegisterForm's onSuccess context below
    router.push("/dashboard");
  }

  return (
    <PageShell tournament={tournament}>
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6">
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === "register"
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-900 bg-white"
          }`}
        >
          Регистрация
        </button>
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === "login"
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-900 bg-white"
          }`}
        >
          Уже есть аккаунт
        </button>
      </div>

      {tab === "login" ? (
        <LoginForm onSuccess={handleLoginSuccess} />
      ) : (
        <RegisterAndJoinForm joinToken={joinToken} onSuccess={handleRegisterSuccess} />
      )}
    </PageShell>
  );
}

// ─── Register + auto-join in a single request ──────────────────────────────

function RegisterAndJoinForm({
  joinToken,
  onSuccess,
}: {
  joinToken: string;
  onSuccess: (u: User) => void;
}) {
  const [form, setForm] = useState({ phone: "", name: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const result = await api.registerAndJoin(joinToken, form);
      onSuccess(result.user);
    } catch (err) {
      setErrors(err as Record<string, string | string[]>);
    } finally {
      setLoading(false);
    }
  }

  const fieldError = (field: string) => {
    const val = errors[field];
    if (!val) return null;
    return <p className="text-xs text-red-600 mt-1">{Array.isArray(val) ? val[0] : val}</p>;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
        <input type="text" value={form.name} onChange={update("name")} placeholder="Алан Смагулов" required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
        {fieldError("name")}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона</label>
        <input type="tel" value={form.phone} onChange={update("phone")} placeholder="+7 700 000 00 00" required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
        {fieldError("phone")}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
        <input type="password" value={form.password} onChange={update("password")} placeholder="Минимум 6 символов" required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
        {fieldError("password")}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
        <input type="password" value={form.confirm_password} onChange={update("confirm_password")} placeholder="••••••••" required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
        {fieldError("confirm_password")}
      </div>

      {errors.detail && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {String(errors.detail)}
        </p>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base transition-colors">
        {loading ? "Регистрация..." : "Зарегистрироваться и вступить"}
      </button>
    </form>
  );
}

// ─── Shared page shell ─────────────────────────────────────────────────────

function PageShell({ tournament, children }: { tournament: Tournament; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🏓 ТТ Платформа</h1>
        </div>

        {/* Tournament info card */}
        <div className="bg-blue-600 rounded-2xl p-5 mb-4 text-white">
          <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Приглашение на турнир</p>
          <h2 className="text-xl font-bold">{tournament.name}</h2>
          {tournament.description && (
            <p className="text-blue-100 text-sm mt-1 line-clamp-2">{tournament.description}</p>
          )}
          <p className="text-blue-200 text-sm mt-2">👥 {tournament.participant_count} участников</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
