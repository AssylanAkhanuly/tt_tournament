"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ApiError, User } from "@/lib/types";

interface Props {
  onSuccess?: (user: User) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [form, setForm] = useState({ phone: "", name: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState<Partial<typeof form> & { detail?: string }>({});
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
      const user = await api.register(form);
      onSuccess?.(user);
    } catch (err) {
      setErrors(err as ApiError);
    } finally {
      setLoading(false);
    }
  }

  const fieldError = (field: string) => {
    const val = errors[field as keyof typeof errors];
    return val ? <p className="text-xs text-red-600 mt-1">{Array.isArray(val) ? val[0] : val}</p> : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
        <input
          type="text"
          value={form.name}
          onChange={update("name")}
          placeholder="Алан Смагулов"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        {fieldError("name")}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона</label>
        <input
          type="tel"
          value={form.phone}
          onChange={update("phone")}
          placeholder="+7 700 000 00 00"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        {fieldError("phone")}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
        <input
          type="password"
          value={form.password}
          onChange={update("password")}
          placeholder="Минимум 6 символов"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        {fieldError("password")}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
        <input
          type="password"
          value={form.confirm_password}
          onChange={update("confirm_password")}
          placeholder="••••••••"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        {fieldError("confirm_password")}
      </div>

      {errors.detail && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors.detail}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
      >
        {loading ? "Регистрация..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}
