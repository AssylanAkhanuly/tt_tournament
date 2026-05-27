"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";
import { loginSchema } from "@/lib/validation";
import PinInput from "./PinInput";
import PhoneInput from "./PhoneInput";
import SpinCoachLogo from "./SpinCoachLogo";

interface Props {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate with Zod
    const result = loginSchema.safeParse({ phone, pin });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errs[field] = err.message;
      });
      setFieldErrors(errs);
      return;
    }

    if (pin.length < 6) { setError("Введите 6-значный PIN-код."); return; }
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
      {/* Logo */}
      <div className="mb-auto">
        <SpinCoachLogo size="sm" />
      </div>

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
          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Номер телефона
            </label>
            <PhoneInput value={phone} onChange={setPhone} required autoFocus />
            {fieldErrors.phone && <p className="text-red-300 text-xs mt-1">{fieldErrors.phone}</p>}
          </div>

          {/* PIN */}
          <div className="space-y-4">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Ваш PIN-код
            </label>
            <PinInput value={pin} onChange={setPin} />
            {fieldErrors.pin && <p className="text-red-300 text-xs mt-1">{fieldErrors.pin}</p>}
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

        <p className="text-center text-sm text-white/40">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-blue-400 hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
