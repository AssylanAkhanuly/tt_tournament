"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import PinInput from "./PinInput";

interface Props {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#163535] flex flex-col px-6 py-10">
      {/* Logo */}
      <div className="text-white/50 text-sm font-medium mb-auto">🏓 ТТ Платформа</div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        {/* Heading */}
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            С возвращением!
          </h1>
          <p className="text-white/55 mt-2 text-sm">
            Введите номер и PIN-код для входа.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone — regular input, no country-code box */}
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
          </div>

          {/* PIN */}
          <div className="space-y-4">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Ваш PIN-код
            </label>
            <PinInput value={pin} onChange={setPin} />
          </div>

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
      </div>
    </div>
  );
}
